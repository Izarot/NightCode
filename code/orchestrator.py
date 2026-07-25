import json
import os
import re
import sys
import time
import requests
import subprocess

# OpenRouter Setup - Target a fast, high-capacity free coding model
API_KEY = os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR-KEY-HERE")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "qwen/qwen-2.5-coder-32b-instruct:free"


def call_llm(system_prompt, user_prompt, retries=3):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    for attempt in range(retries):
        try:
            response = requests.post(API_URL, json=payload, headers=headers, timeout=60)
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            elif response.status_code in (429, 502, 503, 504):
                print(f"⚠️ API Status {response.status_code}. Retrying in {2 ** attempt}s...")
                time.sleep(2 ** attempt)
            else:
                raise Exception(f"API Error {response.status_code}: {response.text}")
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error: {e}. Retrying...")
            time.sleep(2 ** attempt)

    raise Exception("❌ Max API retries exceeded.")


def generate_folder_slug(goal):
    """Derives a clean folder slug locally without an extra API call."""
    words = re.findall(r"\b[a-zA-Z0-9]+\b", goal.lower())
    ignore_words = {
        "make", "create", "build", "game", "a", "in", "the", "using", "with", "and", "to", "for", "of", "tool", "app"
    }
    filtered_words = [w for w in words if w not in ignore_words]
    slug = "-".join(filtered_words[:4])
    return slug if slug else "app-project"


def extract_json(text):
    """Robustly extracts JSON object even if surrounded by commentary."""
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

    print(f"🚀 NightCode Task: {user_vision}")
    print(f"📁 Output Destination: output/{folder_slug}/\n")

    # Fast Architectural Blueprint (1 quick API call)
    print("🧠 [Architect] Creating technical specification...")
    strategy = call_llm(
        "You are a Software Architect. Give a concise 2-sentence file structure plan for the requested software.",
        user_vision
    )
    print(f"📋 Strategy Plan:\n{strategy}\n" + "-" * 50)

    for turn in range(1, max_turns + 1):
        print(f"--- 🔄 ITERATION {turn}/{max_turns} ---")

        coder_system = (
            "You are an expert developer. Output ONLY a valid raw JSON object mapping "
            "filenames to their complete code contents (e.g. {\"index.html\": \"...\", \"game.js\": \"...\"}). "
            "Do NOT include markdown blocks like ```json or any conversational commentary."
        )

        coder_prompt = (
            f"Goal: {user_vision}\n"
            f"Architecture Strategy: {strategy}\n"
            f"Previous Feedback/Error: {feedback}"
        )

        print("🤖 [LLM A] Generating codebase...")
        raw_response = call_llm(coder_system, coder_prompt)
        json_str = extract_json(raw_response)

        try:
            file_map = json.loads(json_str)
        except json.JSONDecodeError as e:
            feedback = f"Output was invalid JSON: {e}. Output ONLY a raw JSON object with keys as filenames and values as code string."
            print("⚠️ Output was not valid JSON. Requesting fix in next turn...")
            continue

        # Save files (with automatic subdirectory creation!)
        for filename, content in file_map.items():
            file_path = os.path.join(target_dir, filename)
            
            # Ensure subfolders exist if filename contains relative path
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Saved {filename}")

        # Check if python execution test is applicable (e.g. if main.py exists)
        main_file = os.path.join(target_dir, "main.py")
        if os.path.exists(main_file):
            print("🧪 Testing main.py in sandbox...")
            res = subprocess.run(
                [sys.executable, main_file],
                input="1\nAlice\n",
                capture_output=True,
                text=True,
                timeout=10,
                cwd=target_dir,
            )
            if res.returncode == 0:
                print("\n✅ Verified successfully!")
                return
            feedback = res.stderr
            print(f"⚠️ Execution Error:\n{feedback[:200]}...")
        else:
            print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/")
            return

        print("🕵️ [LLM B] Reviewing error...")
        feedback = call_llm("Explain concisely how to fix the broken execution error.", f"Error:\n{feedback}")

    print("\n🎉 NightCode execution complete!")


if __name__ == "__main__":
    GOAL = "Create a 3D Voxel game using HTML5, Three.js, and JavaScript with player movement, block placement, and a simple UI."
    run_refinement_loop(GOAL)