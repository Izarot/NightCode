import json
import os
import re
import sys
import requests
import subprocess

# OpenRouter Setup
API_KEY = os.getenv("OPENROUTER_API_KEY", "sk-or-v1-YOUR-KEY-HERE")
API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"


def call_llm(system_prompt, user_prompt):
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

    response = requests.post(API_URL, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")

    return response.json()["choices"][0]["message"]["content"]


def generate_folder_slug(goal):
    """Asks the LLM to create a clean, 2-4 word dash-separated folder name."""
    system_prompt = "You create clean directory names. Convert the user's goal into a short 2-4 word slug with hyphens. Respond with ONLY the slug, no spaces, no punctuation."
    slug = call_llm(system_prompt, goal).strip().lower()
    slug = re.sub(r"[^\w-]", "", slug)  # Keep only alphanumeric & hyphens
    return slug if slug else "app-project"


def install_package(package_name):
    """Dynamically installs a missing Python package using pip."""
    print(f"📦 Auto-installing missing dependency: {package_name}...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", package_name],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"✅ Successfully installed {package_name}!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package_name}: {e.stderr}")
        return False


def run_refinement_loop(goal):
    max_turns = 10
    file_map = {}
    feedback = "Initial build."

    # Generate a clean short folder slug
    folder_slug = generate_folder_slug(goal)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(repo_root, "output", folder_slug)
    os.makedirs(target_dir, exist_ok=True)

    print(f"🚀 Starting NightCode Goal: {goal}")
    print(f"📁 Output Destination: {target_dir}\n")

    for turn in range(1, max_turns + 1):
        print(f"--- 🔄 ITERATION {turn}/{max_turns} ---")

        # 1. LLM A (Multi-file JSON Coder)
        coder_system = """You are an expert Python developer. 
Output a valid JSON object mapping filenames to their file contents.
You MUST include a 'main.py' as the main entry point, and you can include modular files (e.g. 'utils.py', 'config.py') and a 'README.md'.
Do NOT include markdown block formatting like ```json. Output ONLY raw JSON."""

        coder_prompt = f"Goal: {goal}\nPrevious Files Generated:\n{json.dumps(file_map, indent=2)}\nFeedback/Error to fix:\n{feedback}"

        print("🤖 [LLM A] Generating multi-file project...")
        response_text = call_llm(coder_system, coder_prompt)

        # Clean JSON markdown quotes if the model outputs them
        response_text = (
            response_text.replace("```json", "").replace("```", "").strip()
        )

        try:
            file_map = json.loads(response_text)
        except json.JSONDecodeError:
            feedback = "Your output was not valid JSON! Make sure you output ONLY a raw valid JSON object mapping filenames to file code."
            print("⚠️ Failed! Output was not valid JSON. Retrying...")
            continue

        # Write all generated files to the target subfolder
        for filename, content in file_map.items():
            file_path = os.path.join(target_dir, filename)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Wrote {filename}")

        main_file = os.path.join(target_dir, "main.py")

        # 2. Execution Test & Dependency Interception Loop
        retry_test = True
        while retry_test:
            retry_test = False
            print("🧪 Testing main.py in sandbox...")
            try:
                result = subprocess.run(
                    [sys.executable, main_file],
                    input="1\nAlice\n",
                    capture_output=True,
                    text=True,
                    timeout=10,
                    cwd=target_dir,  # Run execution context directly inside output folder
                )

                if result.returncode == 0:
                    print("\n✅ Multi-file project executed successfully!")
                    print(f"Output:\n{result.stdout}")
                    print(f"\n🎉 NightCode build complete! Files saved in: output/{folder_slug}/")
                    return

                error_log = result.stderr

                # --- AUTO-DEPENDENCY CHECK ---
                match = re.search(
                    r"ModuleNotFoundError: No module named '([^']+)'", error_log
                )
                if match:
                    missing_module = match.group(1)
                    print(f"⚠️ Detected missing module: '{missing_module}'")
                    if install_package(missing_module):
                        retry_test = True
                        continue

                print(f"⚠️ Failed! Execution Error:\n{error_log[:200]}...")

            except subprocess.TimeoutExpired:
                error_log = "Execution timed out! Code got stuck on input or an infinite loop."
                print(f"⚠️ Failed! {error_log}")

        # 3. LLM B (Critic)
        critic_system = "You are a code reviewer. Analyze the error and explain concisely what needs to be changed."
        critic_prompt = f"Goal: {goal}\nBroken Files:\n{json.dumps(file_map)}\nTerminal Error:\n{error_log}"

        print("🕵️ [LLM B] Reviewing error...")
        feedback = call_llm(critic_system, critic_prompt)

    print("\n🎉 NightCode execution complete!")


if __name__ == "__main__":
    GOAL = "Build a weather reporting tool that fetches mock weather data from a helper module, formats it, and outputs a formatted report."
    run_refinement_loop(GOAL)