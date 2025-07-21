import requests
import os
from dotenv import load_dotenv
load_dotenv()

# Tu peux aussi charger cette clé via dotenv ou depuis un fichier de config
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

def generate_code(prompt, language="python"):
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    system_prompt = f"""
Tu es un assistant qui génère uniquement du code {language}, sans explication, sans texte autour.
Tu dois retourner un code exécutable tel quel.
"""

    data = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.2
    }

    response = requests.post(GROQ_ENDPOINT, headers=headers, json=data)
    response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    return content.strip()
