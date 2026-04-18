# Rota para geração e gestão de cards
from flask import Blueprint, request, jsonify
from services.ai_service import ask_llama
from models.database import save_deck, get_all_decks

flashcards_bp = Blueprint('flashcards', __name__)

@flashcards_bp.route('/flashcards/generate', methods=['POST'])
def generate_flashcards():
    data = request.get_json()
    content = data.get('content', '').strip()
    title = data.get('title', 'Baralho').strip()

    if not content:
        return jsonify({'error': 'Conteúdo obrigatório'}), 400

    prompt = (
        f"Crie flashcards de estudo a partir do conteúdo abaixo sobre '{title}'.\n"
        f"Retorne APENAS um JSON válido no formato:\n"
        f'[{{"pergunta": "...", "resposta": "..."}}, ...]\n'
        f"Gere entre 5 e 10 flashcards. Conteúdo:\n{content}"
    )

    try:
        cards = ask_llama(prompt, json_mode=True)
        save_deck(title, cards)
        return jsonify({'title': title, 'flashcards': cards})
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar flashcards: {str(e)}'}), 500

@flashcards_bp.route('/flashcards', methods=['GET'])
def list_flashcards():
    try:
        decks = get_all_decks()
        return jsonify({'decks': decks})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

