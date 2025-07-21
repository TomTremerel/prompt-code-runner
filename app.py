from flask import Flask, request, jsonify
from flask_cors import CORS
from docker_runner import run_in_docker, LANGUAGES
from code_gen import generate_code

app = Flask(__name__)
CORS(app)

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    prompt = data.get('prompt')
    language = data.get('language')

    if not prompt or not language:
        return jsonify({"error": "Prompt and language are required"}), 400

    if language not in LANGUAGES:
        return jsonify({"error": "Language not supported"}), 400

    try:
        code = generate_code(prompt, language=language)
        return jsonify({"code": code})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/run', methods=['POST'])
def run():
    data = request.json
    code = data.get('code')
    language = data.get('language')

    if not code or not language:
        return jsonify({"error": "Code and language are required"}), 400

    result = run_in_docker(code, language)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
