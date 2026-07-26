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

# Exact Free Models from your OpenRouter screenshots
MODEL_SPEC = "openai/gpt-oss-20b:free"         # High reasoning for specs
MODEL_ARCHITECT = "inclusionai/ling-3.0-flash-20260723:free" # Fast architecture

# Fallback list for the Coder. 
# Nemotron models added at the front since no one uses them (avoids rate limits!)
MODELS_CODER = [
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "poolside/laguna-s-2.1:free",
    "openai/gpt-oss-20b:free",
    "inclusionai/ling-3.0-flash-20260723:free"
]

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
        "max_tokens": 8000
    }

    # Much longer delays for free tier rate limits
    delays = [10, 30, 60]

    for attempt in range(retries):
        try:
            print(f"⏳ Sending API request to {model} (Attempt {attempt + 1}/{retries})...", flush=True)
            response = requests.post(API_URL, json=payload, headers=headers, timeout=90)

            if response.status_code == 200:
                print("✅ API Response Received!", flush=True)
                data = response.json()
                try:
                    content = data["choices"][0]["message"]["content"]
                    if content:
                        return content
                except (KeyError, IndexError, TypeError):
                    pass
                print("⚠️ Received empty content structure. Retrying...", flush=True)
            elif response.status_code == 429:
                # Smart Rate Limit Handling: Check for Retry-After header
                retry_after = response.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    wait_time = int(retry_after)
                else:
                    wait_time = delays[min(attempt, len(delays) - 1)]
                
                print(f"⚠️ Rate limited by {model}. Sleeping for {wait_time}s...", flush=True)
                time.sleep(wait_time)
                continue # Skip the default sleep below and retry immediately
            else:
                print(f"⚠️ Status Code {response.status_code}: {response.text[:150]}", flush=True)

        except requests.exceptions.Timeout:
            print("⏱️ Request timed out. Retrying...", flush=True)
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error: {e}. Retrying...", flush=True)

        # Default sleep if it wasn't a 429 or if header was missing
        if attempt < retries - 1:
            time.sleep(delays[min(attempt, len(delays) - 1)])

    return None # Return None instead of raising exception so we can try fallback models


def generate_game_specification_with_llm_x(seed_prompt):
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
    if not spec:
        raise Exception("❌ Failed to generate game specification. API completely unavailable.")
    return spec


def generate_folder_slug(seed_prompt):
    """Derives a clean folder slug from the SEED PROMPT."""
    words = re.findall(r"\b[a-zA-Z0-9]+\b", str(seed_prompt).lower())
    ignore_words = {
        "make", "create", "build", "game", "a", "in", "the", "using", "with", "and", "to", "for", "of", "tool", "app"
    }
    filtered_words = [w for w in words if w not in ignore_words]
    slug = "-".join(filtered_words[:4])
    return slug if slug else "app-project"


def extract_json(text):
    """Robustly extracts JSON by finding the first { and the last }."""
    if not text or not isinstance(text, str):
        return "{}"
    
    text = re.sub(r"```(?:json)?", "", text).strip()
    
    start = text.find('{')
    end = text.rfind('}')
    
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    return text


def run_refinement_loop(user_vision, seed_prompt):
    max_turns = 5
    file_map = {}
    feedback = "Initial build."

    folder_slug = generate_folder_slug(seed_prompt)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(repo_root, "output", folder_slug)
    os.makedirs(target_dir, exist_ok=True)

    print(f"📁 Output Destination: output/{folder_slug}/\n", flush=True)

    print("🧠 [Architect] Creating technical file blueprint...", flush=True)
    strategy = call_llm(
        MODEL_ARCHITECT,
        "You are a Lead Software Architect. Provide a concise 2-sentence file structure plan for the requested software.",
        user_vision,
    )
    if not strategy:
        strategy = "Standard HTML5 game structure: index.html, style.css, game.js"
        print("⚠️ Architect unavailable, using default strategy.", flush=True)
        
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

        raw_response = None
        
        # Try each coder model until one succeeds
        for coder_model in MODELS_CODER:
            print(f"🤖 [LLM A] Generating codebase with {coder_model}...", flush=True)
            raw_response = call_llm(coder_model, coder_system, coder_prompt)
            
            if raw_response:
                break # Success! Break out of the fallback loop
            else:
                print(f"⚠️ {coder_model} failed completely. Trying next fallback model...", flush=True)
                
        if not raw_response:
            raise Exception("❌ All coder models failed due to rate limits or errors. Aborting.")

        json_str = extract_json(raw_response)

        try:
            file_map = json.loads(json_str)
        except json.JSONDecodeError as e:
            feedback = f"Output was invalid JSON: {e}. Output ONLY a raw JSON object with keys as filenames and values as code strings."
            print("⚠️ Output was not valid JSON. Retrying...", flush=True)
            continue

        # Save files safely
        for filename, content in file_map.items():
            clean_filename = os.path.normpath(filename).lstrip('./')
            if os.path.isabs(clean_filename):
                clean_filename = os.path.basename(clean_filename)
                
            file_path = os.path.join(target_dir, clean_filename)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Saved {clean_filename}", flush=True)

        # Verify HTML5 Structure
        main_py = os.path.join(target_dir, "main.py")
        index_html = os.path.join(target_dir, "index.html")

        if os.path.exists(main_py):
            print("🧪 Testing main.py in sandbox...", flush=True)
            try:
                res = subprocess.run(
                    [sys.executable, main_py],
                    input="1\nAlice\n",
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=target_dir,
                )
                if res.returncode == 0:
                    print("\n✅ Verified successfully!", flush=True)
                    return
                feedback = res.stderr or res.stdout
                print(f"⚠️ Execution Error:\n{feedback[:200]}...", flush=True)
            except subprocess.TimeoutExpired:
                feedback = "Script timed out after 10 seconds. Check for infinite loops."
                print(f"⚠️ Timeout Error: {feedback}", flush=True)
                
        elif os.path.exists(index_html):
            print("🎨 HTML5 Game detected. Verifying structure...", flush=True)
            with open(index_html, "r", encoding="utf-8") as f:
                html_content = f.read()
                
            if "<canvas" in html_content:
                print("✅ HTML5 Canvas structure verified!", flush=True)
                print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/", flush=True)
                return
            else:
                feedback = "index.html was generated but is missing the <canvas> element required for the game."
                print(f"⚠️ Verification Error: {feedback}", flush=True)
        else:
            print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/", flush=True)
            print("⚠️ Note: No main.py or index.html found to automatically test.", flush=True)
            return

        print("🕵️ [LLM B] Reviewing error...", flush=True)
        feedback = call_llm(MODEL_SPEC, "Explain concisely how to fix the broken execution/structure error.", f"Error:\n{feedback}")

    print("\n🎉 NightCode execution complete!", flush=True)


if __name__ == "__main__":
    SEED_CONCEPT = "A fast-paced neon top-down arcade shooter."

    generated_goal = generate_game_specification_with_llm_x(SEED_CONCEPT)
    print(f"\n✨ [LLM X Generated Goal]:\n{generated_goal}\n" + "=" * 50 + "\n", flush=True)

    run_refinement_loop(generated_goal, SEED_CONCEPT)
