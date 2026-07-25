import subprocess
import os
import requests

# OpenRouter Setup
API_URL = "https://openrouter.ai/api/v1/chat/completions"
API_KEY = "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"

# Free model on OpenRouter
MODEL = "openrouter/free"


def call_llm(system_prompt, user_prompt):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    }
    
    response = requests.post(API_URL, json=payload, headers=headers)
    if response.status_code != 200:
        raise Exception(f"API Error {response.status_code}: {response.text}")
        
    return response.json()["choices"][0]["message"]["content"]

def run_refinement_loop(goal, filename="generated_app.py"):
    max_turns = 5
    current_code = ""
    feedback = "Initial build."

    print(f"🚀 Starting NightCode Goal: {goal}\n")

    for turn in range(1, max_turns + 1):
        print(f"--- 🔄 ITERATION {turn}/{max_turns} ---")
        
        # 1. LLM A (Coder)
        coder_system = "You are a Python programmer. Output ONLY executable Python code. Do NOT use markdown formatting (no ``` markdown) or extra text."
        coder_prompt = f"Goal: {goal}\nPrevious Code:\n{current_code}\nFeedback/Error to fix:\n{feedback}"
        
        print("🤖 [LLM A] Generating code...")
        current_code = call_llm(coder_system, coder_prompt)
        
        # Strip code blocks if the model still outputs them
        current_code = current_code.replace("```python", "").replace("```", "").strip()

        # Save generated code to disk
        with open(filename, "w") as f:
            f.write(current_code)

        # 2. Execution Test (Passing simulated stdin so input() doesn't hang)
        print("🧪 Testing code in terminal...")
        result = subprocess.run(
            ["python", filename], 
            input="Hello NightCode\n", # Feeds simulated input into input() calls
            capture_output=True, 
            text=True,
            timeout=10 # Prevents infinite hanging
        )
        
        if result.returncode == 0:
            print("\n✅ Code executed successfully!")
            print(f"Output:\n{result.stdout}")
            break
        
        error_log = result.stderr
        print(f"⚠️ Failed! Execution Error:\n{error_log[:200]}...")

        # 3. LLM B (Critic)
        critic_system = "You are a code reviewer. Analyze the error and explain concisely what needs to be changed."
        critic_prompt = f"Goal: {goal}\nBroken Code:\n{current_code}\nTerminal Error:\n{error_log}"
        
        print("🕵️ [LLM B] Reviewing error...")
        feedback = call_llm(critic_system, critic_prompt)

    print("\n🎉 NightCode execution complete!")

if __name__ == "__main__":
    GOAL = "Write a python script that takes input from users , runs it through a function and returns the output in a formatted way." 
    run_refinement_loop(GOAL)