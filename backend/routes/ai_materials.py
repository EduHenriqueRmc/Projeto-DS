# Rota para geração de materiais de estudo com auxílio de IA
from flask import Blueprint, request, jsonify
from services.ai_service import ask_llama
from models.database import save_material, get_all_materials, delete_material

ai_materials_bp = Blueprint('ai_materials', __name__)


@ai_materials_bp.route('/materials', methods=['GET'])
def list_materials():
    """Lista todos os materiais gerados por IA do usuário."""
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'ID do usuário não fornecido'}), 400

    try:
        materials = get_all_materials(user_id)
        return jsonify({'materials': materials})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@ai_materials_bp.route('/materials/generate/summary', methods=['POST'])
def generate_summary():
    """
    Gera um resumo a partir de um conteúdo fornecido pelo usuário.

    Body JSON esperado:
    {
        "user_id": 1,
        "title": "Resumo de Termodinâmica",
        "content": "conteúdo bruto que o usuário quer resumir..."
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    title = data.get('title', 'Resumo').strip()
    content = data.get('content', '').strip()

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    if not content:
        return jsonify({'error': 'Conteúdo obrigatório para gerar o resumo.'}), 400

    prompt = (
        f"Crie um resumo de estudo claro e bem estruturado sobre '{title}'.\n"
        f"Use tópicos, destaque os conceitos mais importantes e seja objetivo.\n"
        f"Conteúdo para resumir:\n{content}"
    )

    try:
        result = ask_llama(prompt)
        saved = save_material(user_id, title, result, material_type='resumo')
        return jsonify({'message': 'Resumo gerado com sucesso', 'material': saved}), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar resumo: {str(e)}'}), 500


@ai_materials_bp.route('/materials/generate/essay', methods=['POST'])
def generate_essay():
    """
    Gera uma redação/texto dissertativo sobre um tema.

    Body JSON esperado:
    {
        "user_id": 1,
        "title": "Redação sobre meio ambiente",
        "theme": "Os impactos das queimadas no Brasil",
        "style": "dissertativo-argumentativo"   (opcional)
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    title = data.get('title', 'Redação').strip()
    theme = data.get('theme', '').strip()
    style = data.get('style', 'dissertativo-argumentativo').strip()

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    if not theme:
        return jsonify({'error': 'O tema da redação é obrigatório.'}), 400

    prompt = (
        f"Escreva uma redação no estilo {style} sobre o tema: '{theme}'.\n"
        f"Estruture com introdução, desenvolvimento (2 parágrafos) e conclusão.\n"
        f"Use linguagem formal, apresente argumentos sólidos e proposta de intervenção se aplicável."
    )

    try:
        result = ask_llama(prompt)
        saved = save_material(user_id, title, result, material_type='redação')
        return jsonify({'message': 'Redação gerada com sucesso', 'material': saved}), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar redação: {str(e)}'}), 500


@ai_materials_bp.route('/materials/generate/exercises', methods=['POST'])
def generate_exercises():
    """
    Gera uma lista de exercícios sobre um tema.

    Body JSON esperado:
    {
        "user_id": 1,
        "title": "Exercícios de Probabilidade",
        "content": "conteúdo ou tema sobre o qual gerar exercícios...",
        "quantity": 5    (opcional, padrão 5)
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    title = data.get('title', 'Exercícios').strip()
    content = data.get('content', '').strip()
    quantity = data.get('quantity', 5)

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    if not content:
        return jsonify({'error': 'Conteúdo ou tema obrigatório para gerar exercícios.'}), 400

    prompt = (
        f"Crie {quantity} exercícios de estudo sobre '{title}'.\n"
        f"Para cada exercício, forneça o enunciado e a resposta comentada.\n"
        f"Varie o nível de dificuldade entre fácil, médio e difícil.\n"
        f"Baseie-se neste conteúdo:\n{content}"
    )

    try:
        result = ask_llama(prompt)
        saved = save_material(user_id, title, result, material_type='exercícios')
        return jsonify({'message': 'Exercícios gerados com sucesso', 'material': saved}), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao gerar exercícios: {str(e)}'}), 500


@ai_materials_bp.route('/materials/<int:material_id>', methods=['DELETE'])
def remove_material(material_id):
    """Remove um material gerado."""
    data = request.get_json()
    user_id = data.get('user_id') if data else None

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    try:
        success = delete_material(user_id, material_id)
        if not success:
            return jsonify({'error': 'Material não encontrado ou sem permissão.'}), 404
        return jsonify({'message': 'Material removido com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500