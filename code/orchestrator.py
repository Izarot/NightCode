import json
import os
import re
import sys
import time
import random
import requests
import subprocess

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

MODEL_SPEC = "google/gemini-2.0-flash-exp:free"         
MODEL_ARCHITECT = "inclusionai/ling-3.0-flash-20260723:free" 

MODELS_CODER = [
    "deepseek/deepseek-chat:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "deepseek/deepseek-r1:free",
    "google/gemini-2.0-flash-exp:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "poolside/laguna-s-2.1:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "inclusionai/ling-3.0-flash-20260723:free"
]

FAMOUS_IDEAS = [
    "A classic Snake game where the snake grows longer as it eats apples.",
    "A Pong clone with a neon aesthetic and AI opponent.",
    "A Breakout/Arkanoid game where the player bounces a ball to break bricks.",
    "An Asteroids clone where the player shoots flying space rocks.",
    "A Tetris-style block stacking puzzle game.",
    "A Space Invaders style shooter with descending alien waves.",
    "A simple Flappy Bird clone where you click to fly through pipes.",
    "A top-down 2D maze game where you collect coins and avoid ghosts (Pac-Man style)."
]

def call_llm(model, system_prompt, user_prompt, retries=3):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com",
        "X-Title": "NightCode Orchestrator",
    }

    if GEMINI_API_KEY:
        headers["HTTP-Provider-Google"] = f"Bearer {GEMINI_API_KEY}"

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 8000
    }

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
                retry_after = response.headers.get("Retry-After")
                if retry_after and retry_after.isdigit():
                    wait_time = int(retry_after)
                else:
                    wait_time = delays[min(attempt, len(delays) - 1)]
                print(f"⚠️ Rate limited by {model}. Sleeping for {wait_time}s...", flush=True)
                time.sleep(wait_time)
                continue
            else:
                print(f"⚠️ API Error {response.status_code}: {response.text}", flush=True)

        except requests.exceptions.Timeout:
            print("⏱️ Request timed out. Retrying...", flush=True)
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Network error: {e}. Retrying...", flush=True)

        if attempt < retries - 1:
            time.sleep(delays[min(attempt, len(delays) - 1)])

    return None

def generate_game_specification_with_llm_x(seed_prompt):
    system_prompt = (
        "You are LLM X, a Game Director and Lead Systems Architect. "
        "Your sole job is to take a basic seed concept and expand it into a detailed, "
        "actionable technical specification for a complete 2D HTML5 Canvas game. "
        "Specify explicit requirements for: player movement physics, mechanics, "
        "visuals, and sleek HUD/UI elements. "
        "Output ONLY the complete goal specification text."
    )
    print(f"🎯 [LLM X] Generating high-level goal specification for: {seed_prompt}", flush=True)
    spec = call_llm(MODEL_SPEC, system_prompt, seed_prompt)
    if not spec:
        raise Exception("❌ Failed to generate game specification. API completely unavailable.")
    return spec

def generate_folder_slug(seed_prompt):
    words = re.findall(r"\b[a-zA-Z0-9]+\b", str(seed_prompt).lower())
    ignore_words = {
        "make", "create", "build", "game", "a", "in", "the", "using", "with", "and", "to", "for", "of", "tool", "app", "style", "clone"
    }
    filtered_words = [w for w in words if w not in ignore_words]
    slug = "-".join(filtered_words[:4])
    return slug if slug else "app-project"

def extract_json(text):
    if not text or not isinstance(text, str):
        return "{}"
    text = re.sub(r"```(?:json)?", "", text).strip()
    start = text.find('{')
    end = text.rfind('}')
    if start != -1 and end != -1 and end > start:
        return text[start:end+1]
    return text

def save_files(target_dir, file_map):
    for filename, content in file_map.items():
        try:
            clean_filename = os.path.normpath(filename).lstrip('./')
            if os.path.isabs(clean_filename):
                clean_filename = os.path.basename(clean_filename)
            file_path = os.path.join(target_dir, clean_filename)
            dir_name = os.path.dirname(file_path)
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"  📄 Saved {clean_filename}", flush=True)
        except Exception as e:
            print(f"  ⚠️ Skipping file {filename} due to error: {e}", flush=True)

def verify_project(target_dir):
    """Returns True if verified, False if broken."""
    main_py = os.path.join(target_dir, "main.py")
    index_html = os.path.join(target_dir, "index.html")

    if os.path.exists(main_py):
        print("🧪 Testing main.py in sandbox...", flush=True)
        try:
            res = subprocess.run([sys.executable, main_py], input="1\nAlice\n", capture_output=True, text=True, timeout=10, cwd=target_dir)
            if res.returncode == 0:
                print("\n✅ Verified successfully!", flush=True)
                return True
            return False
        except subprocess.TimeoutExpired:
            return False
            
    elif os.path.exists(index_html):
        print("🎨 HTML5 Game detected. Verifying structure...", flush=True)
        with open(index_html, "r", encoding="utf-8") as f:
            html_content = f.read()
        if "<canvas" in html_content:
            print("✅ HTML5 Canvas structure verified!", flush=True)
            return True
        return False
    return False

def run_refinement_loop(user_vision, seed_prompt):
    max_turns = 20
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
        for coder_model in MODELS_CODER:
            print(f"🤖 [LLM A] Generating codebase with {coder_model}...", flush=True)
            raw_response = call_llm(coder_model, coder_system, coder_prompt)
            if raw_response:
                break
            else:
                print(f"⚠️ {coder_model} failed completely. Trying next fallback model...", flush=True)
                
        if not raw_response:
            print("❌ All coder models failed. Skipping to next project idea.", flush=True)
            return

        json_str = extract_json(raw_response)

        try:
            file_map = json.loads(json_str)
            if not file_map:
                feedback = "Output was an empty JSON object {}. Please generate the actual code files."
                print("⚠️ Output was empty JSON. Retrying...", flush=True)
                continue
        except json.JSONDecodeError as e:
            feedback = f"Output was invalid JSON: {e}. Output ONLY a raw JSON object with keys as filenames and values as code strings."
            print("⚠️ Output was not valid JSON. Retrying...", flush=True)
            continue

        save_files(target_dir, file_map)

        if verify_project(target_dir):
            print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/", flush=True)
            return

        feedback = "Execution failed or structure invalid." # Basic fallback
        main_py = os.path.join(target_dir, "main.py")
        if os.path.exists(main_py):
            try:
                res = subprocess.run([sys.executable, main_py], input="1\nAlice\n", capture_output=True, text=True, timeout=10, cwd=target_dir)
                feedback = res.stderr or res.stdout
            except subprocess.TimeoutExpired:
                feedback = "Script timed out after 10 seconds. Check for infinite loops."
        elif os.path.exists(index_html):
            feedback = "index.html was generated but is missing the <canvas> element required for the game."
        else:
            feedback = "Neither main.py nor index.html was generated. Ensure you output standard web files."
            
        print(f"⚠️ Error:\n{feedback[:200]}...", flush=True)

        print("🕵️ [LLM B] Reviewing error...", flush=True)
        llm_b_response = call_llm(MODEL_SPEC, "Explain concisely how to fix the broken execution/structure error.", f"Error:\n{feedback}")
        if llm_b_response:
            feedback = llm_b_response
        else:
            print("⚠️ LLM B failed to respond. Keeping previous feedback.", flush=True)

    print("\n⚠️ Max cycles reached. Saving debug log.", flush=True)
    with open(os.path.join(target_dir, "debug.log"), "w") as f:
        f.write(f"Failed to build after {max_turns} cycles.\nLast Feedback:\n{feedback}")


def improve_project(target_dir):
    """Phase 2: Attempts to fix a broken project."""
    debug_file = os.path.join(target_dir, "debug.log")
    if not os.path.exists(debug_file):
        return
        
    with open(debug_file, "r") as f:
        error_content = f.read()
        
    # Read existing code to feed back to the LLM
    existing_files = {}
    for item in os.listdir(target_dir):
        file_path = os.path.join(target_dir, item)
        if os.path.isfile(file_path) and item != "debug.log":
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    existing_files[item] = f.read()
            except:
                pass
                
    if not existing_files:
        return

    print(f"\n🔧 [FIXER] Attempting to fix: {os.path.basename(target_dir)}", flush=True)
    
    coder_system = (
        "You are an expert software developer. You will be given existing code and an error. "
        "Output ONLY a valid raw JSON object mapping filenames to their complete FIXED code contents. "
        "Do NOT include markdown block formatting like ```json or any conversational commentary."
    )
    coder_prompt = (
        f"Here is the existing code:\n{json.dumps(existing_files)}\n\n"
        f"Here is the error/feedback:\n{error_content}\n\n"
        "Fix the code and output the complete fixed JSON."
    )

    # 3 attempts to fix it
    for turn in range(1, 4):
        print(f"🤖 [LLM A] Fix attempt {turn}/3...", flush=True)
        raw_response = None
        for coder_model in MODELS_CODER:
            raw_response = call_llm(coder_model, coder_system, coder_prompt)
            if raw_response: break
            
        if not raw_response: return
        
        json_str = extract_json(raw_response)
        try:
            file_map = json.loads(json_str)
            if not file_map: continue
        except:
            continue
            
        save_files(target_dir, file_map)
        
        if verify_project(target_dir):
            print("✅ Successfully fixed! Removing debug.log.", flush=True)
            os.remove(debug_file)
            return
        else:
            print("⚠️ Still broken. Will try again if time permits.", flush=True)


if __name__ == "__main__":
    print("🚀 NightCode Orchestrator starting.", flush=True)
    overall_start_time = time.time()
    phase_1_end_time = overall_start_time + (5 * 3600) # 5 hours for new games
    phase_2_end_time = phase_1_end_time + (40 * 60)    # 40 mins for fixing
    
    # --- PHASE 1: NEW GAMES (5 HOURS) ---
    print("🟢 PHASE 1: Generating new games for 5 hours.", flush=True)
    while time.time() < phase_1_end_time:
        try:
            SEED_CONCEPT = random.choice(FAMOUS_IDEAS)
            generated_goal = generate_game_specification_with_llm_x(SEED_CONCEPT)
            print(f"\n✨ [LLM X Generated Goal]:\n{generated_goal}\n" + "=" * 50 + "\n", flush=True)
            run_refinement_loop(generated_goal, SEED_CONCEPT)
            print("\n🔄 Project finished! Starting next project in 10 seconds...\n", flush=True)
            time.sleep(10)
        except Exception as e:
            print(f"\n💥 Critical error on this project: {e}. Moving to next idea in 30 seconds...", flush=True)
            time.sleep(30)
            
    # --- PHASE 2: FIXING BROKEN GAMES (40 MINUTES) ---
    print("\n🟡 PHASE 2: Improving incomplete games for 40 minutes.", flush=True)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(repo_root, "output")
    
    while time.time() < phase_2_end_time:
        broken_projects = []
        if os.path.exists(output_dir):
            for folder in os.listdir(output_dir):
                folder_path = os.path.join(output_dir, folder)
                if os.path.isdir(folder_path) and os.path.exists(os.path.join(folder_path, "debug.log")):
                    broken_projects.append(folder_path)
                    
        if not broken_projects:
            print("✅ No broken projects found! Generating a new game instead.", flush=True)
            try:
                SEED_CONCEPT = random.choice(FAMOUS_IDEAS)
                generated_goal = generate_game_specification_with_llm_x(SEED_CONCEPT)
                run_refinement_loop(generated_goal, SEED_CONCEPT)
            except Exception as e:
                print(f"Error: {e}", flush=True)
                time.sleep(30)
        else:
            for project in broken_projects:
                if time.time() >= phase_2_end_time:
                    break
                try:
                    improve_project(project)
                except Exception as e:
                    print(f"Error fixing {project}: {e}", flush=True)
                    
    print("👋 NightCode Orchestrator finished its shift. Goodnight!", flush=True)
