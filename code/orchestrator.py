import json
import os
import re
import sys
import time
import random
import requests
import subprocess

# ZETA & IZAROT MASTERPIECE
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from games import FAMOUS_IDEAS

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
API_URL = "https://openrouter.ai/api/v1/chat/completions"

def git_push():
    try:
        subprocess.run(["git", "add", "."], check=True)
        status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
        if status.stdout.strip():
            print("📦 Git: Committing changes...", flush=True)
            subprocess.run(["git", "commit", "-m", "a new update"], check=True)
            print("🚀 Git: Pushing to GitHub...", flush=True)
            subprocess.run(["git", "push"], check=True)
            print("✅ Git: Push successful!", flush=True)
        else:
            print("✅ Git: No changes to push.", flush=True)
    except subprocess.CalledProcessError as e:
        print(f"⚠️ Git Error: {e}", flush=True)

def get_free_models():
    print("🔍 Fetching live free models from OpenRouter...", flush=True)
    try:
        res = requests.get("https://openrouter.ai/api/v1/models", timeout=15)
        res.raise_for_status()
        data = res.json()
        
        free_models = [model["id"] for model in data.get("data", []) if model.get("pricing", {}).get("prompt") == "0"]
                
        if not free_models:
            print("⚠️ No free models found! Falling back to known defaults.", flush=True)
            return ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free"]
            
        print(f"✅ Found {len(free_models)} free models available right now!", flush=True)
        return free_models
        
    except Exception as e:
        print(f"⚠️ Failed to fetch models: {e}. Using fallbacks.", flush=True)
        return ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free"]

ALL_FREE_MODELS = get_free_models()
MODELS_SPEC = ALL_FREE_MODELS.copy()
MODELS_ARCHITECT = ALL_FREE_MODELS.copy()
MODELS_CODER = ALL_FREE_MODELS.copy()

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
                wait_time = int(retry_after) if retry_after and retry_after.isdigit() else delays[min(attempt, len(delays) - 1)]
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

def update_games_list():
    """LLM Q: Generates 100 new game ideas and rewrites games.py"""
    print("\n🧠 [LLM Q] Expanding game idea library...", flush=True)
    system_prompt = (
        "You are LLM Q, a creative game designer. Your job is to generate 100 short, compact, and unique 2D HTML5 Canvas game concepts. "
        "Examples: 'A Snake game where the snake leaves a trail of fire.', 'A Pong clone with 3 balls.'. "
        "Output ONLY a valid raw JSON array of 100 strings. No markdown formatting, no conversational text."
    )
    user_prompt = "Generate 100 new game ideas now."
    
    models_to_try = ALL_FREE_MODELS.copy()
    random.shuffle(models_to_try)
    
    for model in models_to_try:
        response = call_llm(model, system_prompt, user_prompt)
        if response:
            try:
                text = response.replace("```json", "").replace("```", "").strip()
                start = text.find('[')
                end = text.rfind(']')
                if start != -1 and end != -1:
                    new_ideas = json.loads(text[start:end+1])
                    
                    # Combine existing with new, and remove duplicates
                    combined = list(dict.fromkeys(FAMOUS_IDEAS + new_ideas))
                    
                    # Write back to games.py
                    games_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "games.py")
                    with open(games_path, "w", encoding="utf-8") as f:
                        f.write("# NightCode Game Ideas Library (Auto-updated by LLM Q)\n")
                        f.write("FAMOUS_IDEAS = " + json.dumps(combined, indent=4))
                        
                    print(f"✅ Added {len(new_ideas)} new ideas! Total games: {len(combined)}", flush=True)
                    return combined # Return the new list to use for tonight's run
            except Exception as e:
                print(f"⚠️ Failed to parse LLM Q response: {e}", flush=True)
        else:
            print(f"⚠️ {model} failed for LLM Q. Trying next...", flush=True)
            
    print("⚠️ Failed to update games list. Using existing list.", flush=True)
    return FAMOUS_IDEAS

def generate_game_specification_with_llm_x(seed_prompt):
    system_prompt = (
        "You are LLM X, a Game Director and Lead Systems Architect. "
        "Your sole job is to take a basic seed concept and expand it into a detailed, "
        "actionable technical specification for a complete 2D HTML5 Canvas game. "
        "Specify explicit requirements for: player movement physics, mechanics, "
        "visuals, and sleek HUD/UI elements. Output ONLY the complete goal specification text."
    )
    print(f"🎯 [LLM X] Generating high-level goal specification for: {seed_prompt}", flush=True)
    
    models_to_try = MODELS_SPEC.copy()
    random.shuffle(models_to_try)
    
    for spec_model in models_to_try:
        spec = call_llm(spec_model, system_prompt, seed_prompt)
        if spec:
            return spec
        else:
            print(f"⚠️ {spec_model} failed for spec generation. Trying next random model...", flush=True)
            
    raise Exception("❌ Failed to generate game specification. All models unavailable.")

def generate_folder_slug(seed_prompt):
    words = re.findall(r"\b[a-zA-Z0-9]+\b", str(seed_prompt).lower())
    ignore_words = {"make", "create", "build", "game", "a", "in", "the", "using", "with", "and", "to", "for", "of", "tool", "app", "style", "clone"}
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

def generate_readme(target_dir, game_vision):
    print("📝 [LLM B] Generating README.md...", flush=True)
    system_prompt = "You are a technical writer. Create a fun, short README.md in pure markdown format for a game. Include a title, how to play, and a note that it was autonomously generated by NightCode. Output ONLY the raw markdown."
    
    models_to_try = MODELS_ARCHITECT.copy()
    random.shuffle(models_to_try)
    
    for arch_model in models_to_try:
        readme_content = call_llm(arch_model, system_prompt, game_vision)
        if readme_content:
            with open(os.path.join(target_dir, "README.md"), "w", encoding="utf-8") as f:
                f.write(readme_content)
            print("  📄 Saved README.md", flush=True)
            return
        else:
            print(f"⚠️ {arch_model} failed for README. Trying next model...", flush=True)

def run_refinement_loop(user_vision, seed_prompt):
    max_turns = 24 
    file_map = {}
    feedback = "Initial build."
    raw_response = None
    recent_models = [] 

    folder_slug = generate_folder_slug(seed_prompt)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    target_dir = os.path.join(repo_root, "output", folder_slug)
    os.makedirs(target_dir, exist_ok=True)

    print(f"📁 Output Destination: output/{folder_slug}/\n", flush=True)

    print("🧠 [Architect] Creating technical file blueprint...", flush=True)
    
    arch_models = MODELS_ARCHITECT.copy()
    random.shuffle(arch_models)
    strategy = None
    for arch_model in arch_models:
        strategy = call_llm(
            arch_model,
            "You are a Lead Software Architect. Provide a concise 2-sentence file structure plan for the requested software.",
            user_vision,
        )
        if strategy:
            break
        else:
            print(f"⚠️ {arch_model} failed for architecture. Trying next model...", flush=True)
            
    if not strategy:
        strategy = "Standard HTML5 game structure: index.html, style.css, game.js"
        
    print(f"📋 Strategy Plan:\n{strategy}\n" + "-" * 50, flush=True)

    for turn in range(1, max_turns + 1):
        print(f"\n--- 🔄 ITERATION {turn}/{max_turns} ---", flush=True)

        coder_system = (
            "You are an expert software developer. Output ONLY a valid raw JSON object mapping "
            'filenames to their complete code contents (e.g. {"index.html": "...", "game.js": "..."}). '
            "Do NOT include markdown block formatting like ```json or any conversational commentary. "
            "SNEAKY FEATURE 1: Make the canvas responsive so it scales to fit mobile phone screens. "
            "SNEAKY FEATURE 2: Add a cool emoji favicon in the HTML head. "
            "SNEAKY FEATURE 3: Pick a unique, vibrant color palette for the game visuals. "
            "SNEAKY FEATURE 4: Save the player's High Score using the browser's LocalStorage so it persists when they refresh. "
            "Implement simple sound effects using the Web Audio API and a Speedrun Timer in the top corner."
        )

        coder_prompt = (
            f"Goal: {user_vision}\n"
            f"Architecture Strategy: {strategy}\n"
            f"Previous Feedback/Error: {feedback}"
        )

        available_models = [m for m in MODELS_CODER if m not in recent_models]
        if not available_models:
            available_models = MODELS_CODER.copy()
            
        random.shuffle(available_models)

        raw_response = None
        coder_model = None
        for coder_model in available_models:
            print(f"🤖 [LLM A] Generating codebase with {coder_model}...", flush=True)
            raw_response = call_llm(coder_model, coder_system, coder_prompt)
            if raw_response:
                recent_models.append(coder_model)
                if len(recent_models) >= 4:
                    recent_models.pop(0)
                break
            else:
                print(f"⚠️ {coder_model} failed completely. Trying next random model...", flush=True)
                
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
            if "Unterminated string" in str(e) or "Expecting" in str(e) or "EOF" in str(e):
                print("✂️ Code got truncated! Attempting continuation...", flush=True)
                
                cont_system = "You are a code completion AI. The previous JSON response was cut off due to token limits. Continue EXACTLY from the next character. DO NOT repeat ANY previous text. DO NOT use markdown. Just output the remaining characters to complete the JSON."
                cont_prompt = f"Here is the incomplete JSON:\n{raw_response}\n\nContinue the JSON exactly from the next character to finish it."
                
                continuation = call_llm(coder_model, cont_system, cont_prompt)
                if continuation:
                    cont_clean = continuation.replace("```json", "").replace("```", "").strip()
                    raw_response = raw_response + cont_clean
                    json_str = extract_json(raw_response)
                    try:
                        file_map = json.loads(json_str)
                        if file_map:
                            print("✅ Continuation successful! JSON is now valid.", flush=True)
                        else:
                            feedback = "Continuation still resulted in empty JSON. Start over."
                            continue
                    except json.JSONDecodeError as e2:
                        feedback = f"Even after continuation, JSON was invalid: {e2}. Start over and write shorter code."
                        print("⚠️ Continuation failed. Retrying from scratch...", flush=True)
                        with open(os.path.join(target_dir, "debug.log"), "w") as f:
                            f.write(f"JSON Decode Error after continuation: {e2}\n\nRaw: {raw_response}")
                        continue
                else:
                    feedback = "Continuation API call failed. Start over."
                    continue
            else:
                feedback = f"Output was invalid JSON: {e}. Output ONLY a raw JSON object."
                print("⚠️ Output was not valid JSON. Retrying...", flush=True)
                with open(os.path.join(target_dir, "debug.log"), "w") as f:
                    f.write(f"JSON Decode Error: {e}\n\nRaw LLM Output that failed to parse:\n{raw_response}")
                continue

        save_files(target_dir, file_map)

        if verify_project(target_dir):
            print(f"\n🎉 Multi-file project built successfully! Check: output/{folder_slug}/", flush=True)
            generate_readme(target_dir, user_vision)
            git_push() 
            return

        feedback = "Execution failed or structure invalid."
        main_py = os.path.join(target_dir, "main.py")
        index_html = os.path.join(target_dir, "index.html")
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
        
        reviewer_models = MODELS_SPEC.copy()
        random.shuffle(reviewer_models)
        llm_b_response = None
        for rev_model in reviewer_models:
            llm_b_response = call_llm(rev_model, "Explain concisely how to fix the broken execution/structure error.", f"Error:\n{feedback}")
            if llm_b_response:
                break
            else:
                print(f"⚠️ {rev_model} failed for review. Trying next model...", flush=True)

        if llm_b_response:
            feedback = llm_b_response
        else:
            print("⚠️ LLM B failed to respond. Keeping previous feedback.", flush=True)

    print("\n⚠️ Max cycles reached. Saving debug log.", flush=True)
    with open(os.path.join(target_dir, "debug.log"), "w") as f:
        f.write(f"Failed to build after {max_turns} cycles.\nLast Feedback:\n{feedback}\n\nLast Raw Response:\n{raw_response}")
    git_push() 

def improve_project(target_dir):
    debug_file = os.path.join(target_dir, "debug.log")
    if not os.path.exists(debug_file):
        return
        
    with open(debug_file, "r") as f:
        error_content = f.read()
        
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

    for turn in range(1, 4):
        print(f"🤖 [LLM A] Fix attempt {turn}/3...", flush=True)
        
        models_to_try = MODELS_CODER.copy()
        random.shuffle(models_to_try)
        
        raw_response = None
        for coder_model in models_to_try:
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
            git_push() 
            return
        else:
            print("⚠️ Still broken. Will try again if time permits.", flush=True)

def generate_arcade_lobby():
    print("\n🎮 Building NightCode Arcade Lobby...", flush=True)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_dir = os.path.join(repo_root, "output")
    
    games = []
    if os.path.exists(output_dir):
        for folder in os.listdir(output_dir):
            folder_path = os.path.join(output_dir, folder)
            if os.path.isdir(folder_path) and os.path.exists(os.path.join(folder_path, "index.html")):
                desc = "An AI-generated game."
                readme_path = os.path.join(folder_path, "README.md")
                if os.path.exists(readme_path):
                    with open(readme_path, "r", encoding="utf-8") as f:
                        lines = [l.strip() for l in f.read().split('\n') if l.strip() and not l.strip().startswith('#')]
                        if lines: desc = lines[0][:100]
                games.append({"folder": folder, "name": folder.replace("-", " ").title(), "desc": desc})
                
    featured_game = random.choice(games) if games else None
                
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NightCode Arcade</title>
    <style>
        :root {{ --bg: #0f0f1a; --text: #00ffcc; --card: #1a1a2e; --glow: 0 0 10px #00ffcc; }}
        [data-theme="light"] {{ --bg: #f0f0f0; --text: #1a1a2e; --card: #ffffff; --glow: 0 4px 8px rgba(0,0,0,0.2); }}
        body {{ background-color: var(--bg); color: var(--text); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin: 0; padding: 20px; transition: background 0.3s; }}
        h1 {{ font-size: 3em; text-shadow: var(--glow); text-transform: uppercase; animation: fadeIn 2s; }}
        .header {{ display: flex; justify-content: center; gap: 15px; margin-bottom: 20px; }}
        button {{ background: var(--card); color: var(--text); border: 1px solid var(--text); padding: 10px 20px; cursor: pointer; border-radius: 5px; font-weight: bold; transition: 0.2s; }}
        button:hover {{ transform: scale(1.05); box-shadow: var(--glow); }}
        .featured {{ background: var(--card); border: 2px solid var(--text); border-radius: 15px; padding: 30px; margin: 40px auto; max-width: 600px; animation: float 3s ease-in-out infinite; }}
        .featured h2 {{ font-size: 2em; margin: 0; }}
        .featured p {{ color: #aaa; }}
        .grid {{ display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; }}
        .card {{ background: var(--card); border: 2px solid var(--text); border-radius: 10px; padding: 20px; width: 250px; text-decoration: none; color: var(--text); transition: transform 0.3s, box-shadow 0.3s; opacity: 0; animation: fadeIn 0.5s forwards; }}
        .card:hover {{ transform: translateY(-10px) scale(1.05); box-shadow: 0 10px 20px rgba(0, 255, 204, 0.4); }}
        .title {{ font-size: 1.4em; font-weight: bold; text-transform: capitalize; }}
        .desc {{ font-size: 0.9em; color: #888; margin-top: 10px; }}
        @keyframes fadeIn {{ to {{ opacity: 1; }} }}
        @keyframes float {{ 0%, 100% {{ transform: translateY(0); }} 50% {{ transform: translateY(-10px); }} }}
    </style>
</head>
<body>
    <div class="header">
        <button onclick="toggleTheme()">Toggle Theme</button>
        <button id="authBtn" onclick="toggleAuth()">Login</button>
    </div>
    <h1>NightCode Arcade</h1>
    <p id="greeting">Autonomously generated by AI</p>
    
    <script>
        function toggleTheme() {{
            const current = document.documentElement.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', current === 'light' ? 'dark' : 'light');
        }}
        function toggleAuth() {{
            let user = localStorage.getItem('nightcode_user');
            if (user) {{
                localStorage.removeItem('nightcode_user');
                document.getElementById('authBtn').innerText = 'Login';
                document.getElementById('greeting').innerText = 'Autonomously generated by AI';
            }} else {{
                let name = prompt('Enter your name:');
                if (name) {{
                    localStorage.setItem('nightcode_user', name);
                    document.getElementById('authBtn').innerText = 'Logout';
                    document.getElementById('greeting').innerText = 'Welcome back, ' + name + '!';
                }}
            }}
        }}
        window.onload = () => {{
            let user = localStorage.getItem('nightcode_user');
            if (user) {{
                document.getElementById('authBtn').innerText = 'Logout';
                document.getElementById('greeting').innerText = 'Welcome back, ' + user + '!';
            }}
        }}
    </script>
"""
    if featured_game:
        html_content += f'''
        <div class="featured">
            <h2>⭐ Featured Game: {featured_game["name"]} ⭐</h2>
            <p>{featured_game["desc"]}</p>
            <br>
            <a href="{featured_game["folder"]}/index.html"><button>Play Now!</button></a>
        </div>
        '''
        
    html_content += '<div class="grid">\n'
    for i, game in enumerate(games):
        delay = i * 0.1
        html_content += f'        <a href="{game["folder"]}/index.html" class="card" style="animation-delay: {delay}s"><div class="title">{game["name"]}</div><div class="desc">{game["desc"]}</div></a>\n'
        
    html_content += """    </div>
</body>
</html>"""

    with open(os.path.join(output_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)
    print("✅ Arcade Lobby built at output/index.html", flush=True)

if __name__ == "__main__":
    print("🚀 NightCode Orchestrator starting.", flush=True)
    
    # LLM Q expands the game library at the very start of the shift!
    FAMOUS_IDEAS = update_games_list()
    git_push() # Save the new ideas to GitHub immediately
    
    overall_start_time = time.time()
    
    run_mode = os.getenv("RUN_MODE", "FULL_RUN")
    
    if run_mode == "FIX_ONLY":
        print("🟡 MIDNOON SHIFT: Fixing broken games for 1 hour.", flush=True)
        phase_1_end_time = overall_start_time
        phase_2_end_time = overall_start_time + (60 * 60)
    else:
        print("🟢 NIGHT SHIFT: Generating new games for 5 hours, then 40 mins fixing.", flush=True)
        phase_1_end_time = overall_start_time + (5 * 3600)
        phase_2_end_time = phase_1_end_time + (40 * 60)
    
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
            
    if time.time() < phase_2_end_time:
        print("\n🟡 PHASE 2: Improving incomplete games.", flush=True)
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
                        
    generate_arcade_lobby()
    git_push() 
    
    print("👋 NightCode Orchestrator finished its shift. Goodnight!", flush=True)
