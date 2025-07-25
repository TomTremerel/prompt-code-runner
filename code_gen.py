import os
import re
import json
import logging
from typing import List, Dict, Optional, Union
from dotenv import load_dotenv
from groq import Groq

# Configuration
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CodeChatAssistant:
    """Assistant de chat spécialisé dans la génération et modification de code."""
    
    DEFAULT_MODEL = "llama3-8b-8192"
    MAX_RETRIES = 3
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("La clé d'API GROQ n'est pas configurée.")
        
        self.client = Groq(api_key=self.api_key)
    
    def _escape_code_for_json(self, code: str) -> str:
        """Échappe complètement le code pour JSON."""
        if not isinstance(code, str):
            return ""
        
        # Échappement complet pour JSON
        escaped = (code
                  .replace('\\', '\\\\')  # Backslashes d'abord
                  .replace('"', '\"')    # Guillemets doubles
                  .replace('\n', '\\n')   # Sauts de ligne
                  .replace('\r', '\\r')   # Retours chariot
                  .replace('\t', '\\t')   # Tabulations
                  .replace('\b', '\\b')   # Backspace
                  .replace('\f', '\\f'))  # Form feed
        
        return escaped
    
    def _create_simple_prompt(self, language: str, user_message: str, code_context: str = "") -> str:
        """Crée un prompt simple et direct."""
        context_part = f"\n\nCode existant à considérer:\n{code_context}" if code_context else ""
        
        return f"""Tu es un expert en {language}. 

Demande de l'utilisateur: {user_message}{context_part}

Réponds avec EXACTEMENT ce format (sans markdown, sans ```):
{{"chat_message": "ton explication ici", "code": "le code ici"}}

Si tu ne peux pas générer de code, utilise "code": null.
IMPORTANT: N'oublie pas d'inclure toutes les bibliothèques nécessaires (imports). Remplace tous les sauts de ligne dans le code par \\n et échappe les guillemets avec \\""."""
    
    def _force_json_generation(self, language: str, user_message: str, code_context: str = "") -> Dict:
        """Génère une réponse en forçant le format JSON."""
        
        # Méthode 1: Génération avec contraintes strictes
        try:
            prompt = self._create_simple_prompt(language, user_message, code_context)
            
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.DEFAULT_MODEL,
                temperature=0.1,  # Très bas pour plus de cohérence
                max_tokens=2000,
                stop=["\n\n", "```"]  # Arrête avant le markdown
            )
            
            content = response.choices[0].message.content.strip()
            logger.info(f"Réponse brute: {content[:100]}...")
            
            # Nettoyage agressif
            content = self._clean_response(content)
            
            # Parse JSON
            try:
                result = json.loads(content)
                if isinstance(result, dict) and "chat_message" in result:
                    return result
            except json.JSONDecodeError:
                logger.warning("Échec parsing JSON, tentative réparation...")
                
        except Exception as e:
            logger.error(f"Erreur génération: {e}")
        
        # Méthode 2: Génération séparée du message et du code
        return self._generate_separately(language, user_message, code_context)
    
    def _clean_response(self, content: str) -> str:
        """Nettoie agressivement la réponse."""
        # Supprime markdown
        content = re.sub(r'```[\w]*\n?', '', content)
        content = re.sub(r'```', '', content)
        
        # Trouve le JSON
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
        
        # Corrige les guillemets triples dans le JSON
        content = re.sub(r'"""([^"]*?)"""', lambda m: '"' + self._escape_code_for_json(m.group(1)) + '"', content, flags=re.DOTALL)
        
        return content.strip()
    
    def _generate_separately(self, language: str, user_message: str, code_context: str = "") -> Dict:
        """Génère le message et le code séparément pour éviter les problèmes JSON."""
        
        try:
            # 1. Génère d'abord le message explicatif
            message_prompt = f"En tant qu'expert {language}, explique brièvement ce que tu vas faire pour: {user_message}"
            
            message_response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": message_prompt}],
                model=self.DEFAULT_MODEL,
                temperature=0.2,
                max_tokens=200
            )
            
            chat_message = message_response.choices[0].message.content.strip()
            
            # 2. Génère le code
            code_prompt = f"""Génère UNIQUEMENT le code {language} pour: {user_message}
            
Code existant à considérer:
{code_context if code_context else "Aucun"}

Réponds UNIQUEMENT avec le code, sans explication, sans markdown, sans ```."""
            
            code_response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": code_prompt}],
                model=self.DEFAULT_MODEL,
                temperature=0.1,
                max_tokens=1500
            )
            
            code = code_response.choices[0].message.content.strip()
            
            # Nettoie le code
            code = re.sub(r'```[\w]*\n?', '', code)
            code = re.sub(r'```', '', code)
            code = code.strip()
            
            return {
                "chat_message": chat_message,
                "code": code if code else None
            }
            
        except Exception as e:
            logger.error(f"Erreur génération séparée: {e}")
            return {
                "chat_message": f"Erreur lors de la génération: {str(e)}",
                "code": None
            }
    
    def _create_fallback_response(self, language: str, error_msg: str = "") -> Dict:
        """Crée une réponse de fallback."""
        
        # Code d'exemple selon le langage
        examples = {
            "python": 'print("Hello, World!")',
            "javascript": 'console.log("Hello, World!");',
            "java": 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\}',
            "c++": '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
            "c": '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}'
        }
        
        default_code = examples.get(language.lower(), f'// Code d\'exemple {language}\nconsole.log("Hello, World!");')
        
        return {
            "chat_message": f"Je n'ai pas pu générer une réponse complète{': ' + error_msg if error_msg else ''}. Voici un exemple de base en {language}:",
            "code": default_code
        }
    
    def generate_chat_response(
        self, 
        history: List[Dict], 
        code_context: Optional[str] = None, 
        language: str = "Python"
    ) -> Dict[str, Union[str, None]]:
        """
        Génère une réponse de chat avec gestion robuste des erreurs JSON.
        """
        try:
            if not history or not isinstance(history, list):
                return self._create_fallback_response(language, "Historique invalide")
            
            # Récupère le dernier message utilisateur
            last_message = None
            for msg in reversed(history):
                if msg.get("type") == "user" and msg.get("content"):
                    last_message = msg["content"]
                    break
            
            if not last_message:
                return self._create_fallback_response(language, "Pas de message utilisateur trouvé")
            
            logger.info(f"Traitement de: {last_message[:50]}...")
            
            # Tentative de génération avec plusieurs méthodes
            for attempt in range(self.MAX_RETRIES):
                try:
                    result = self._force_json_generation(language, last_message, code_context or "")
                    
                    # Validation du résultat
                    if (isinstance(result, dict) and 
                        "chat_message" in result and 
                        isinstance(result["chat_message"], str) and 
                        result["chat_message"].strip()):
                        
                        logger.info(f"Génération réussie (tentative {attempt + 1})")
                        return result
                    
                except Exception as e:
                    logger.warning(f"Tentative {attempt + 1} échouée: {e}")
                    if attempt == self.MAX_RETRIES - 1:
                        return self._create_fallback_response(language, f"Échec après {self.MAX_RETRIES} tentatives")
            
            return self._create_fallback_response(language, "Toutes les tentatives ont échoué")
            
        except Exception as e:
            logger.error(f"Erreur critique: {e}")
            return self._create_fallback_response(language, f"Erreur critique: {str(e)}")


# Fonction de compatibilité
def generate_chat_response(
    history: List[Dict], 
    code_context: Optional[str] = None, 
    language: str = "Python"
) -> Dict[str, Union[str, None]]:
    """Interface de compatibilité."""
    assistant = CodeChatAssistant()
    return assistant.generate_chat_response(history, code_context, language)


# Test
if __name__ == "__main__":
    sample_history = [
        {"type": "user", "content": "Crée une fonction Python pour calculer la suite de Fibonacci"}
    ]
    
    try:
        response = generate_chat_response(sample_history, language="Python")
        print("✅ Test réussi!")
        print(f"Message: {response['chat_message']}")
        print(f"Code: {response['code'][:100] if response['code'] else 'None'}...")
        
        # Vérification que la réponse peut être sérialisée en JSON
        json_test = json.dumps(response, ensure_ascii=False)
        print("✅ Sérialisation JSON réussie!")
        
    except Exception as e:
        print(f"❌ Test échoué: {e}")
