# Rota para importação e gestão de arquivos do usuário
from flask import Blueprint, request, jsonify
from models.database import save_file, get_all_files, delete_file

files_bp = Blueprint('files', __name__)

# Limite de tamanho: 5MB em caracteres (texto puro)
MAX_CONTENT_LENGTH = 5 * 1024 * 1024

@files_bp.route('/files', methods=['GET'])
def list_files():
    """Lista todos os arquivos importados do usuário."""
    user_id = request.args.get('user_id', type=int)

    if not user_id:
        return jsonify({'error': 'ID do usuário não fornecido'}), 400

    try:
        files = get_all_files(user_id)
        return jsonify({'files': files})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@files_bp.route('/files', methods=['POST'])
def upload_file():
    """
    Recebe um arquivo de texto do frontend e armazena no banco.
    
    Body JSON esperado:
    {
        "user_id": 1,
        "filename": "resumo_matematica.txt",
        "content": "conteúdo textual do arquivo...",
        "type": "txt"         (opcional — ex: txt, pdf, md)
    }
    """
    data = request.get_json()

    user_id = data.get('user_id')
    filename = data.get('filename', '').strip()
    content = data.get('content', '').strip()
    file_type = data.get('type', 'txt').strip()

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado. Faça login para importar arquivos.'}), 401

    if not filename:
        return jsonify({'error': 'Nome do arquivo é obrigatório'}), 400

    if not content:
        return jsonify({'error': 'Conteúdo do arquivo não pode estar vazio'}), 400

    if len(content) > MAX_CONTENT_LENGTH:
        return jsonify({'error': 'Arquivo muito grande. Limite: 5MB de texto.'}), 413

    try:
        saved = save_file(user_id, filename, content, file_type)
        return jsonify({'message': 'Arquivo importado com sucesso', 'file': saved}), 201
    except Exception as e:
        return jsonify({'error': f'Erro ao salvar arquivo: {str(e)}'}), 500


@files_bp.route('/files/<int:file_id>', methods=['DELETE'])
def remove_file(file_id):
    """Remove um arquivo específico do usuário."""
    data = request.get_json()
    user_id = data.get('user_id') if data else None

    if not user_id:
        return jsonify({'error': 'Usuário não autenticado.'}), 401

    try:
        success = delete_file(user_id, file_id)
        if not success:
            return jsonify({'error': 'Arquivo não encontrado ou sem permissão.'}), 404
        return jsonify({'message': 'Arquivo removido com sucesso'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500