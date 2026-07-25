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
    """Generates a clean 2-4 word directory slug directly from the goal string."""
    words = re.findall(r"\b[a-zA-Z0-9]+\b", goal.lower())
    ignore_words = {
        "write", "a", "python", "script", "build", "tool", "that", "uses",
        "for", "to", "and", "with", "an", "make", "create", "game"
    }
    filtered_words = [w for w in words if w not in ignore_words]
    slug = "-".join(filtered_words[:4])
    return slug if slug else "app-project"


def run_llm_x_architect(user_vision):
    """LLM X: Product Manager that expands a high-level vision into detailed technical specs."""
    print("🧠 [LLM X - Architect] Expanding vision into detailed blueprint...")
    system_prompt = (
        "You are a Lead Software Architect. Take the high-level project vision "
        "and expand it into a detailed specification. Define the project layout, "
        "required features, key files (e.g. main.py, utils.py, index.html, etc.), and implementation requirements."
    )
    spec = call_llm(system_prompt, user_vision)
    print("\n📋 Project Architecture Specs:\n" + spec + "\n" + "=" * 50)
    return spec


def run_dev_team_huddle(goal_spec, current_files, max_turns=6):
    """Pre-iteration conversation between LLM A (Coder) and LLM B (Reviewer)."""
    print("💬 [Team Huddle] LLM A & LLM B brainstorming iteration strategy...")
    
    conversation = []
    coder_persona = "You are LLM A (Lead Developer). Propose technical implementation plans concise and clearly."
    critic_persona = "You are LLM B (Code Reviewer/Architect). Critique the developer's plan, highlight risks/missing files, and suggest improvements."

    # Turn 1: Developer proposes a plan
    dev_msg = call_llm(
        coder_persona,
        f"Project Spec:\n{goal_spec}\nCurrent Files:\n{json.dumps(current_files)}\nHow should we structure/improve the project in this iteration? Keep response short (2-3 sentences)."
    )
    conversation.append(f"LLM A (Coder): {dev_msg}")

    for i in range(max_turns - 1):
        # Alternate between Critic and Coder
        if i % 2 == 0:
            msg = call_llm(
                critic_persona,
                f"Conversation so far:\n" + "\n".join(conversation) + "\nProvide feedback or approve the plan concisely."
            )
            conversation.append(f"LLM B (Critic): {msg}")
        else:
            msg = call_llm(
                coder_persona,
                f"Conversation so far:\n" + "\n".join(conversation) + "\nAdjust plan based on critic feedback concisely."
            )
            conversation.append(f"LLM A (Coder): {msg}")

    summary = "\n".join(conversation)
    print("🤝 [Team Huddle Complete] Agreed Plan:\n" + summary + "\n" + "-" * 50)
    return summary


def run_refinement_loop(user_vision):
    max_turns = 10
    file_map = {}
    feedback = "Initial build."

    # 1. Trigger LLM X to build full blueprint
    goal_spec = run_llm_x_architect(user_vision)

    folder_slug = generate_folder_slug(user_vision)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(repo_root, "output", folder_slug)
    os.makedirs(target_dir, exist_ok=True)

    print(f"🚀 Starting NightCode Target: {user_vision}")
    print(f"📁 Output Destination: {target_dir}\n")

    for turn in range(1, max_turns + 1):
        print(f"--- 🔄 ITERATION {turn}/{max_turns} ---")

        # 2. Pre-iteration Brainstorm Chat (LLM A + LLM B)
        huddle_plan = run_dev_team_huddle(goal_spec, file_map, max_turns=4)

        # 3. LLM A generates JSON files based on the team's agreement
        coder_system = """You are an expert developer. Output a valid JSON object mapping filenames to their file contents.
Include all necessary source files, config files, and a README.md.
Do NOT include markdown block formatting like ```json. Output ONLY raw JSON."""

        coder_prompt = (
            f"Project Spec:\n{goal_spec}\n"
            f"Agreed Team Strategy:\n{huddle_plan}\n"
            f"Previous Files:\n{json.dumps(file_map, indent=2)}\n"
            f"Terminal Feedback:\n{feedback}"
        )

        print("🤖 [LLM A] Generating multi-file codebase...")
        response_text = call_llm(coder_system, coder_prompt)
        response_text = response_text.replace("```json", "").replace("```", "").strip()

        try:
            file_map = json.loads(response_text)
        except json.JSONDecodeError:
            feedback = "Your output was not valid JSON! Output ONLY a raw valid JSON object mapping filenames to file code."
            print("⚠️ Failed! Output was not valid JSON. Retrying...")
            continue

        # Write files
        for filename, content in file_map.items():
            file_path = os.path.join(target_dir, filename)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Wrote {filename}")

        # Check if python execution test is applicable (e.g. if main.py exists)
        main_file = os.path.join(target_dir, "main.py")
        if os.path.exists(main_file):
            print("🧪 Testing main.py in sandbox...")
            result = subprocess.run(
                [sys.executable, main_file],
                input="1\nAlice\n",
                capture_output=True,
                text=True,
                timeout=10,
                cwd=target_dir,
            )
            if result.returncode == 0:
                print("\n✅ Project built and verified successfully!")
                return
            feedback = result.stderr
            print(f"⚠️ Failed! Execution Error:\n{feedback[:200]}...")
        else:
            print("ℹ️ Web/Multi-asset project generated (no main.py execution needed).")
            print(f"\n🎉 NightCode build complete! Files saved in: output/{folder_slug}/")
            return

    print("\n🎉 NightCode execution complete!")


if __name__ == "__main__":
    # Huge goal example!
    BIG_GOAL = "Create a 3D Voxel game using HTML5, Three.js, and JavaScript with player movement, block placement, and a simple UI."
    run_refinement_loop(BIG_GOAL)