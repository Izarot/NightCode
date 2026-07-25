import os
import re
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
    """Converts a goal string into a safe folder name (e.g. 'user-input-processor')."""
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)  # Remove special chars
    text = re.sub(r"[\s_-]+", "-", text).strip("-")  # Convert spaces to hyphens
    return text[:40]  # Keep it reasonably short


def run_refinement_loop(goal):
    max_turns = 5
    current_code = ""
    feedback = "Initial build."

    # Determine paths relative to repository root
    repo_root = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )  # Step up from code/
    goal_folder_name = slugify(goal)
    target_dir = os.path.join(repo_root, "output", goal_folder_name)

    # Ensure target output subfolder exists
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

        # Clean code blocks
        current_code = (
            current_code.replace("```python", "").replace("```", "").strip()
        )

        # Save generated code to output subfolder
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(current_code)

        # 2. Execution Test
        print("🧪 Testing code in terminal...")
        try:
            result = subprocess.run(
                ["python", file_path],
                input="1\nAlice\n",  # Feeds simulated inputs
                capture_output=True,
                text=True,
                timeout=5,
            )

            if result.returncode == 0:
                print("\n✅ Code executed successfully!")
                print(f"Output:\n{result.stdout}")
                break

            error_log = result.stderr
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
    GOAL = "Write a python script that takes input from users, runs it through a function, and returns the output in a formatted way."
    run_refinement_loop(GOAL)
    