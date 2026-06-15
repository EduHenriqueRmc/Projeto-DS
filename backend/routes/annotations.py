# Rota para anotações manuais vinculadas a arquivos ou baralhos
from flask import Blueprint, request, jsonify
from models.database import save_annotation, get_annotations, update_annotation, delete_annotation

annotations_bp = Blueprint('annotations', __name__)


@annotations_bp.route('/annotations', methods=['GET'])
def list_annotations():
    """
    Lista anotações do usuário.
    Pode filtrar por documento via query param:
      GET /api/annotations?user_id=1
      GET /api/annotations?user_id=1&file_id=3
    """
    user_id = request.args.get('user_id', type=int)
    file_id = request.args.get('file_id', type=int)  # opcional

    if not user_id:
        return jsonify({'error': 'ID do usuário não fornecido'}), 400

    try:
        annotations = get_annotations(user_id, file_id=file_id)
        return jsonify({'annotations': annotations})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('/annotations', methods=['POST'])
def create_annotation():
    """
    Cria uma nova anotação.

    Body JSON esperado:
    {
        "user_id": 1,
        "text": "Lembrar que sen²(x) + cos²(x) = 1",
        "file_id": 3        (opcional — ID do arquivo ao qual a nota pertence)
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    text = data.get('text', '').strip()
    file_id = data.get('file_id')  # pode ser None (nota solta, sem arquivo)

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado. Faça login para anotar.'}), 401

    if not text:
        return jsonify({'error': 'O texto da anotação não pode estar vazio.'}), 400

    try:
        annotation = save_annotation(user_id, text, file_id=file_id)
        return jsonify({'message': 'Anotação salva com sucesso', 'annotation': annotation}), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao salvar anotação: {str(e)}'}), 500


@annotations_bp.route('/annotations/<int:annotation_id>', methods=['PUT'])
def edit_annotation(annotation_id):
    """
    Edita o texto de uma anotação existente.

    Body JSON esperado:
    {
        "user_id": 1,
        "text": "texto corrigido"
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    new_text = data.get('text', '').strip()

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    if not new_text:
        return jsonify({'error': 'O texto da anotação não pode estar vazio.'}), 400

    try:
        updated = update_annotation(user_id, annotation_id, new_text)
        if not updated:
            return jsonify({'error': 'Anotação não encontrada ou sem permissão.'}), 404
        return jsonify({'message': 'Anotação atualizada', 'annotation': updated})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('/annotations/<int:annotation_id>', methods=['DELETE'])
def remove_annotation(annotation_id):
    """Remove uma anotação específica do usuário."""
    data = request.get_json()
    user_id = data.get('user_id') if data else None

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    try:
        success = delete_annotation(user_id, annotation_id)
        if not success:
            return jsonify({'error': 'Anotação não encontrada ou sem permissão.'}), 404
        return jsonify({'message': 'Anotação removida com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500