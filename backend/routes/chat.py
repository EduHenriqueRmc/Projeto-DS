# Rota para o AI Assistant
from flask import Blueprint, request, jsonify
from services.ai_service import ask_llama

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()

    if not message:
        return jsonify({'error': 'Mensagem obrigatória'}), 400

    try:
        reply = ask_llama(message)
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'error': f'Erro ao chamar a API: {str(e)}'}), 500

