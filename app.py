from flask import Flask, request, jsonify
from flask_cors import CORS
from docker_runner import run_in_docker, LANGUAGES
from code_gen import generate_chat_response # Mise à jour de l'import

app = Flask(__name__)
CORS(app)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    history = data.get('history', [])
    code_context = data.get('code_context', '')
    language = data.get('language')

    if not history or not language:
        return jsonify({"error": "L'historique et le langage sont requis"}), 400

    if not history[-1]['content']:
         return jsonify({"error": "Le message de l'utilisateur est vide"}), 400

    try:
        response = generate_chat_response(history, code_context, language)
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/run', methods=['POST'])
def run():
    data = request.json
    code = data.get('code')
    language = data.get('language')

    if not all([code, language]):
        return jsonify({"error": "Le code et le langage sont requis"}), 400

    result = run_in_docker(code, language)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
