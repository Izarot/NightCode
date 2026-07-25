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


def slugify(text):
    """Converts a goal string into a safe folder name."""
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    return text[:40]


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
    current_code = ""
    feedback = "Initial build."

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    goal_folder_name = slugify(goal)
    target_dir = os.path.join(repo_root, "output", goal_folder_name)

    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, "generated_app.py")

    print(f"🚀 Starting NightCode Goal: {goal}")
    print(f"📁 Output Destination: {target_dir}\n")

    for turn in range(1, max_turns + 1):
        print(f"--- 🔄 ITERATION {turn}/{max_turns} ---")

        # 1. LLM A (Coder)
        coder_system = "You are a Python programmer. Output ONLY executable Python code. Do NOT use markdown formatting (no ``` markdown) or extra text."
        coder_prompt = f"Goal: {goal}\nPrevious Code:\n{current_code}\nFeedback/Error to fix:\n{feedback}"

        print("🤖 [LLM A] Generating code...")
        current_code = call_llm(coder_system, coder_prompt)
        current_code = (
            current_code.replace("```python", "").replace("```", "").strip()
        )

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(current_code)

        # 2. Execution Test & Dependency Interception Loop
        retry_test = True
        while retry_test:
            retry_test = False
            print("🧪 Testing code in terminal...")
            try:
                result = subprocess.run(
                    [sys.executable, file_path],
                    input="1\nAlice\n",
                    capture_output=True,
                    text=True,
                    timeout=10,
                )

                if result.returncode == 0:
                    print("\n✅ Code executed successfully!")
                    print(f"Output:\n{result.stdout}")
                    print("\n🎉 NightCode execution complete!")
                    return

                error_log = result.stderr

                # --- AUTO-DEPENDENCY CHECK ---
                match = re.search(r"ModuleNotFoundError: No module named '([^']+)'", error_log)
                if match:
                    missing_module = match.group(1)
                    print(f"⚠️ Detected missing module: '{missing_module}'")
                    
                    # Attempt pip install
                    if install_package(missing_module):
                        retry_test = True  # Re-run test immediately without wasting an LLM call!
                        continue

                print(f"⚠️ Failed! Execution Error:\n{error_log[:200]}...")

            except subprocess.TimeoutExpired:
                error_log = "Execution timed out! Code got stuck on input or an infinite loop."
                print(f"⚠️ Failed! {error_log}")

        # 3. LLM B (Critic)
        critic_system = "You are a code reviewer. Analyze the error and explain concisely what needs to be changed."
        critic_prompt = f"Goal: {goal}\nBroken Code:\n{current_code}\nTerminal Error:\n{error_log}"

        print("🕵️ [LLM B] Reviewing error...")
        feedback = call_llm(critic_system, critic_prompt)

    print("\n🎉 NightCode execution complete!")


if __name__ == "__main__":
    # Test with a goal requiring external third-party libraries!
    GOAL = "Write a python script that uses requests to fetch quotes from [https://dummyjson.com/quotes](https://dummyjson.com/quotes) and displays 2 random ones."
    run_refinement_loop(GOAL)