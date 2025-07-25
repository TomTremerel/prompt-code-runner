import subprocess
import tempfile
import os
import datetime
import re


# Langages supportés et leurs paramètres
LANGUAGES = {
    "python": {
        "image": "python:3.11",
        "file": "code_to_run.py",
        "cmd_template": "/app/venv/bin/python code_to_run.py",
        "dep_cmd": "python -m venv venv && /app/venv/bin/pip install -q --no-cache-dir",
        "dep_regex": r"^\s*(?:import|from)\s+([a-zA-Z0-9_]+)",
        # Liste non exhaustive de modules stdlib à ignorer
        "stdlib": {"os", "sys", "re", "json", "datetime", "math", "random", "collections", "itertools", "functools"}
    },
    "javascript": {
        "image": "node:20",
        "file": "code_to_run.js",
        "cmd_template": "node code_to_run.js",
        "dep_cmd": "npm install",
        "dep_regex": r"require\([\'\"]([^\'\"]+)[\'\"]\)|\s*from\s*[\'\"]([^\'\"]+)[\'\"]",
        # Liste non exhaustive de modules built-in à ignorer
        "stdlib": {"fs", "path", "http", "https", "os", "events", "util"}
    },
    "bash": {
        "image": "bash",
        "file": "code_to_run.sh",
        "cmd_template": "bash code_to_run.sh",
        "dep_cmd": None, # Pas de gestion de dépendances pour bash
        "dep_regex": None,
        "stdlib": set()
    }
}

def extract_dependencies(code, language):
    """Extrait les dépendances du code en utilisant des expressions régulières."""
    config = LANGUAGES.get(language, {})
    regex = config.get("dep_regex")
    stdlib = config.get("stdlib", set())

    if not regex:
        return []

    # Utiliser un set pour éviter les doublons
    dependencies = set()
    matches = re.finditer(regex, code, re.MULTILINE)
    for match in matches:
        # Gérer les multiples groupes de capture (cas JS avec require et from)
        for group in match.groups():
            if group:
                # Ignorer les chemins relatifs/absolus
                if not group.startswith(('.', '/')):
                    dependencies.add(group)
    
    # Filtrer les modules de la bibliothèque standard
    return sorted(list(dependencies - stdlib))


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
    cmd_template = lang_config["cmd_template"]
    
    is_python = (language == "python")
    dependencies = extract_dependencies(code, language)

    # --- MODIFICATION 1 : Créer et trouver le chemin du dossier de cache ---
    # On définit le chemin du dossier de cache sur votre PC (l'hôte)
    # os.path.abspath s'assure que Docker reçoit un chemin complet et non relatif.
    host_cache_dir = os.path.abspath("./docker_pip_cache")
    os.makedirs(host_cache_dir, exist_ok=True) # Crée le dossier s'il n'existe pas.

    # ----------------------------------------------------------------------

    with tempfile.TemporaryDirectory(ignore_cleanup_errors=True) as temp_dir:
        save_code(temp_dir, filename, code)

        # La logique de construction de la commande reste la même que précédemment
        if not is_python:
            dep_cmd = lang_config.get("dep_cmd")
            if dependencies and dep_cmd:
                install_command = f"{dep_cmd} {' '.join(dependencies)}"
                final_cmd = ["/bin/sh", "-c", f"{install_command} && {cmd_template}"]
            else:
                final_cmd = cmd_template.split()
        else:
            command_parts = ["python -m venv venv"]
            if dependencies:
                install_command = f"/app/venv/bin/pip install -q --no-cache-dir {' '.join(dependencies)}"
                command_parts.append(install_command)
            run_command = f"/app/venv/bin/python {filename}"
            command_parts.append(run_command)
            
            main_script = " && ".join(command_parts)
            full_command = f"{main_script}; rm -rf /app/venv"
            final_cmd = ["/bin/sh", "-c", full_command]

        try:
            start_time = datetime.datetime.now()
            result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "--memory=256m",
                    "--network=default",
                    "-v", f"{temp_dir}:/app",
                    
                    # --- MODIFICATION 2 : Monter le dossier de cache en tant que volume ---
                    # On dit à Docker de lier notre dossier hôte au dossier de cache de pip dans le conteneur.
                    "-v", f"{host_cache_dir}:/root/.cache/pip",
                    # --------------------------------------------------------------------

                    "-w", "/app",
                    image,
                    *final_cmd
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=120 # J'ai augmenté un peu le timeout pour le premier téléchargement
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
            return {"error": "Exécution trop longue (timeout de 120s dépassé)"}
        except FileNotFoundError:
            return {"error": "Docker n'est pas installé ou introuvable"}
        except Exception as e:
            return {"error": f"Erreur inconnue : {str(e)}"}
