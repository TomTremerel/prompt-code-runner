import subprocess
import tempfile
import os
import datetime
import uuid
from code_gen import generate_code

# Langages supportés et leurs paramètres
LANGUAGES = {
    "python": {
        "image": "python:3.11",
        "file": "code_to_run.py",
        "cmd": ["python", "code_to_run.py"]
    },
    "javascript": {
        "image": "node:20",
        "file": "code_to_run.js",
        "cmd": ["node", "code_to_run.js"]
    },
    "bash": {
        "image": "bash",  # image officielle très légère
        "file": "code_to_run.sh",
        "cmd": ["bash", "code_to_run.sh"]
    }
}

def choose_language():
    print("🧠 Choisis ton langage :")
    for i, lang in enumerate(LANGUAGES):
        print(f"{i + 1}. {lang}")
    choice = input("👉 Numéro : ").strip()

    try:
        lang_key = list(LANGUAGES.keys())[int(choice) - 1]
        return lang_key
    except (IndexError, ValueError):
        print("❌ Choix invalide.")
        return None

def get_code_from_user(lang):
    print(f"💡 Entrer ton code {lang} ci-dessous (ligne vide pour terminer) :\n")
    lines = []
    while True:
        line = input()
        if line.strip() == "":
            break
        lines.append(line)
    return "\n".join(lines)

def get_code_from_llm(lang):
    prompt = input("💬 Quel code veux-tu générer ?\n👉 ")
    print("⏳ Génération du code depuis Groq...")
    return generate_code(prompt, language=lang)

def save_code(temp_dir, filename, code):
    filepath = os.path.join(temp_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    return filepath


def run_in_docker(image, file, cmd, base_temp_dir):
    # Générer un UUID pour cette exécution
    run_id = str(uuid.uuid4())
    temp_dir = os.path.join(base_temp_dir, f"docker_run_{run_id}")
    os.makedirs(temp_dir, exist_ok=True)

    log_file = os.path.join(temp_dir, f"execution_{run_id}.log")
    log_lines = []

    def log(msg):
        timestamp = datetime.datetime.now().strftime("[%Y-%m-%d %H:%M:%S]")
        line = f"{timestamp} {msg}"
        log_lines.append(line)
        print(line)

    log(f"🆔 ID d’exécution : {run_id}")
    log("🚀 Lancement du conteneur Docker")
    log(f"🔧 Image utilisée : {image}")
    log(f"📁 Fichier à exécuter : {file}")
    log(f"▶️ Commande Docker : {' '.join(cmd)}")

    # Copier le fichier de code dans ce dossier isolé
    original_path = os.path.join(base_temp_dir, file)
    isolated_path = os.path.join(temp_dir, file)
    with open(original_path, "r", encoding="utf-8") as src, open(isolated_path, "w", encoding="utf-8") as dst:
        dst.write(src.read())

    try:
        result = subprocess.run(
            [
                "docker", "run", "--rm",
                "--memory=128m",
                "--network=none",
                "-v", f"{temp_dir}:/app",
                "-w", "/app",
                image,
                *cmd
            ],
            stdout=subprocess.PIPE,     
            stderr=subprocess.PIPE,
            text=True,
            timeout=10
        )

        log(f"✅ Conteneur terminé avec code de sortie : {result.returncode}")

        if result.stdout:
            log("📤 STDOUT :")
            log(result.stdout)
        if result.stderr:
            log("⚠️ STDERR :")
            log(result.stderr)

    except subprocess.TimeoutExpired:
        log("⏰ Erreur : exécution trop longue (timeout)")
    except FileNotFoundError:
        log("❌ Erreur : Docker n'est pas installé ou introuvable")
    except Exception as e:
        log(f"💥 Erreur inconnue : {str(e)}")

    # Sauvegarde des logs
    with open(log_file, "w", encoding="utf-8") as f:
        f.write("\n".join(log_lines))

    log(f"📝 Logs enregistrés dans : {log_file}")

def main():
    lang = input("Langage ? (python / nodejs / bash): ").strip().lower()
    if lang not in LANGUAGES:
        print("Langage non supporté.")
        return

    # Génère le code via Groq
    code = get_code_from_llm(lang)

    # Affiche le code généré
    print("\n🧾 Code généré :\n" + "-"*40)
    print(code)
    print("-"*40)

    # Demande confirmation
    confirm = input("\n✅ Souhaites-tu exécuter ce code dans le conteneur ? (Y/n): ").strip().lower()
    if confirm not in ["", "y", "yes"]:
        print("❌ Exécution annulée.")
        return

    # Continue le pipeline
    with tempfile.TemporaryDirectory() as temp_dir:
        ext = LANGUAGES[lang]["image"]
        image = LANGUAGES[lang]["image"]
        filename = f"code_to_run.{ext}"
        filepath = os.path.join(temp_dir, filename)

        # Écrit le code dans un fichier temporaire
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(code)

        cmd = LANGUAGES[lang]["cmd"] + [filename]
        run_in_docker(image, filename, cmd, temp_dir)


if __name__ == "__main__":
    main()
