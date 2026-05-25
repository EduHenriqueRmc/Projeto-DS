# Rota para geração e gestão de cards
from flask import Blueprint, request, jsonify
from services.ai_service import ask_llama
from models.database import save_deck, get_all_decks

flashcards_bp = Blueprint('flashcards', __name__)

@flashcards_bp.route('/flashcards/generate', methods=['POST'])
def generate_flashcards():
    data = request.get_json()
    # NOVO: Puxando o ID do usuário que o frontend deve enviar
    user_id = data.get('user_id') 
    content = data.get('content', '').strip()
    title = data.get('title', 'Baralho').strip()

    # NOVO: Trava de segurança para usuários não logados
    if not user_id:
        return jsonify({'error': 'Usuário não autenticado. Faça login para salvar flashcards.'}), 401

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
        # ATUALIZADO: Agora enviamos o user_id para a função do banco de dados
        save_deck(user_id, title, cards) 
        return jsonify({'title': title, 'flashcards': cards})
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar flashcards: {str(e)}'}), 500

@flashcards_bp.route('/flashcards', methods=['GET'])
def list_flashcards():
    # NOVO: O frontend vai mandar o ID na URL (ex: /api/flashcards?user_id=1)
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({'error': 'ID do usuário não fornecido'}), 400

    try:
        # ATUALIZADO: Buscando apenas os decks daquele usuário específico
        decks = get_all_decks(user_id) 
        return jsonify({'decks': decks})
    except Exception as e:
        return jsonify({'error': str(e)}), 500