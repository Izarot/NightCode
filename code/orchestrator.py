import json
import os
import re
import sys
import time
import requests
import subprocess

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Exact Free Models from your OpenRouter catalog
MODEL_SPEC = "openai/gpt-oss-20b:free"
MODEL_ARCHITECT = "nvidia/nemotron-3-nano-30b-a3b:free"
MODEL_CODER = "cohere/north-mini-code:free"


def call_llm(model, system_prompt, user_prompt, retries=3):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com",
        "X-Title": "NightCode Orchestrator",
    }

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
    }

    delays = [2, 5, 10]

    for attempt in range(retries):
        try:
            print(f"⏳ Sending API request to {model} (Attempt {attempt + 1}/{retries})...", flush=True)
            # Strict 30s socket timeout prevents workflow from hanging forever
            response = requests.post(API_URL, json=payload, headers=headers, timeout=30)

            if response.status_code == 200:
                print("✅ API Response Received!", flush=True)
                data = response.json()
                # Safe access to prevent NoneType crashes
                try:
                    content = data["choices"][0]["message"]["content"]
                    if content:
                        return content
                except (KeyError, IndexError, TypeError):
                    pass
                print("⚠️ Received empty content structure. Retrying...", flush=True)
            else:
                print(f"⚠️ Status Code {response.status_code}: {response.text[:150]}", flush=True)

        except requests.exceptions.Timeout:
            print("⏱️ Request timed out after 30s. Retrying...", flush=True)
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error: {e}. Retrying...", flush=True)

        if attempt < retries - 1:
            time.sleep(delays[min(attempt, len(delays) - 1)])

    raise Exception(f"❌ API Call failed after {retries} retries on {model}.")


def generate_game_specification_with_llm_x(seed_prompt):
    """
    LLM X (Goal Generator): Expands basic input into a full game specification.
    """
    system_prompt = (
        "You are LLM X, a Game Director and Lead Systems Architect. "
        "Your sole job is to take a basic seed concept and expand it into a detailed, "
        "actionable technical specification for a complete 2D HTML5 Canvas game. "
        "Specify explicit requirements for: player movement physics (WASD/Mouse), shooting mechanics, "
        "particle explosion effects, enemy types/behaviors, wave progression, glowing visuals, "
        "and sleek HUD/UI elements. "
        "Output ONLY the complete goal specification text."
    )

    print("🎯 [LLM X] Generating high-level goal specification...", flush=True)
    spec = call_llm(MODEL_SPEC, system_prompt, seed_prompt)
    return spec


def generate_folder_slug(goal):
    """Derives a clean folder slug locally without an extra API call."""
    words = re.findall(r"\b[a-zA-Z0-9]+\b", str(goal).lower())
    ignore_words = {
        "make", "create", "build", "game", "a", "in", "the", "using", "with", "and", "to", "for", "of", "tool", "app"
    }
    filtered_words = [w for w in words if w not in ignore_words]
    slug = "-".join(filtered_words[:4])
    return slug if slug else "app-project"


def extract_json(text):
    """Extracts JSON object even if surrounded by commentary or markdown blocks."""
    if not text or not isinstance(text, str):
        return ""
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text).strip()
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        return match.group(1)
    return text


def run_refinement_loop(user_vision):
    max_turns = 5
    file_map = {}
    feedback = "Initial build."

    folder_slug = generate_folder_slug(user_vision)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(repo_root, "output", folder_slug)
    os.makedirs(target_dir, exist_ok=True)

    print(f"📁 Output Destination: output/{folder_slug}/\n", flush=True)

    # Fast Architectural Blueprint
    print("🧠 [Architect] Creating technical file blueprint...", flush=True)
    strategy = call_llm(
        MODEL_ARCHITECT,
        "You are a Lead Software Architect. Provide a concise 2-sentence file structure plan for the requested software.",
        user_vision,
    )
    print(f"📋 Strategy Plan:\n{strategy}\n" + "-" * 50, flush=True)

    for turn in range(1, max_turns + 1):
        print(f"\n--- 🔄 ITERATION {turn}/{max_turns} ---", flush=True)

        coder_system = (
            "You are an expert software developer. Output ONLY a valid raw JSON object mapping "
            'filenames to their complete code contents (e.g. {"index.html": "...", "game.js": "..."}). '
            "Do NOT include markdown block formatting like ```json or any conversational commentary."
        )

        coder_prompt = (
            f"Goal: {user_vision}\n"
            f"Architecture Strategy: {strategy}\n"
            f"Previous Feedback/Error: {feedback}"
        )

        print("🤖 [LLM A] Generating codebase...", flush=True)
        raw_response = call_llm(MODEL_CODER, coder_system, coder_prompt)
        json_str = extract_json(raw_response)

        try:
            file_map = json.loads(json_str)
        except json.JSONDecodeError as e:
            feedback = f"Output was invalid JSON: {e}. Output ONLY a raw JSON object with keys as filenames and values as code strings."
            print("⚠️ Output was not valid JSON. Retrying...", flush=True)
            continue

        # Save files (automatically creates nested folders)
        for filename, content in file_map.items():
            file_path = os.path.join(target_dir, filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Saved {filename}", flush=True)

        # Check if Python sandbox testing applies
        main_file = os.path.join(target_dir, "main.py")
        if os.path.exists(main_file):
            print("🧪 Testing main.py in sandbox...", flush=True)
            res = subprocess.run(
                [sys.executable, main_file],
                input="1\nAlice\n",
                capture_output=True,
                text=True,
                timeout=10,
                cwd=target_dir,
            )
            if res.returncode == 0:
                print("\n✅ Verified successfully!", flush=True)
                return
            feedback = res.stderr
            print(f"⚠️ Execution Error:\n{feedback[:200]}...", flush=True)
        else:
            print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/", flush=True)
            return

        print("🕵️ [LLM B] Reviewing error...", flush=True)
        feedback = call_llm(MODEL_SPEC, "Explain concisely how to fix the broken execution error.", f"Error:\n{feedback}")

    print("\n🎉 NightCode execution complete!", flush=True)


if __name__ == "__main__":
    SEED_CONCEPT = "A fast-paced neon top-down arcade shooter."

    # 1. LLM X generates the goal specification
    generated_goal = generate_game_specification_with_llm_x(SEED_CONCEPT)
    print(f"\n✨ [LLM X Generated Goal]:\n{generated_goal}\n" + "=" * 50 + "\n", flush=True)

    # 2. Run the coder refinement pipeline with LLM X's spec
    run_refinement_loop(generated_goal)
