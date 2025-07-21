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

def save_code(temp_dir, filename, code):
    filepath = os.path.join(temp_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(code)
    return filepath


def run_in_docker(code, language):
    if language not in LANGUAGES:
        return {"error": "Langage non supporté"}

    lang_config = LANGUAGES[language]
    image = lang_config["image"]
    filename = lang_config["file"]
    cmd = lang_config["cmd"]

    with tempfile.TemporaryDirectory() as temp_dir:
        filepath = save_code(temp_dir, filename, code)

        try:
            start_time = datetime.datetime.now()
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
            end_time = datetime.datetime.now()
            execution_time = (end_time - start_time).total_seconds() * 1000

            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "exitCode": result.returncode,
                "executionTime": execution_time,
                "timestamp": end_time.isoformat()
            }

        except subprocess.TimeoutExpired:
            return {"error": "Exécution trop longue (timeout)"}
        except FileNotFoundError:
            return {"error": "Docker n'est pas installé ou introuvable"}
        except Exception as e:
            return {"error": f"Erreur inconnue : {str(e)}"}
