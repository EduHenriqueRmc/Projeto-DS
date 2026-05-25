from flask import Blueprint, request, jsonify
from models.database import get_environments, update_environments

# Cria um "pacote" de rotas para os ambientes
envs_bp = Blueprint('environments', __name__)

@envs_bp.route('/environments', methods=['GET'])
def get_envs():
    """Retorna os ambientes salvos associados ao user_id para o frontend montar a tela."""
    # Captura o ID vindo da URL: /api/environments?user_id=1
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"error": "Usuário não identificado."}), 400
        
    envs = get_environments(user_id)
    # Retorna no formato exato que o seu app.js lê (data.environments)
    return jsonify({"environments": envs}), 200

@envs_bp.route('/environments', methods=['POST'])
def save_envs():
    """Recebe a lista atualizada do frontend vinculada ao user_id e salva no banco."""
    data = request.json
    
    # Extrai o ID do usuário e o array de ambientes enviados pelo app.js
    user_id = data.get('user_id')
    envs_data = data.get('environments')
    
    if not user_id or envs_data is None:
        return jsonify({"error": "Dados incompletos para sincronização."}), 400
        
    # Passa ambos os parâmetros para a função atualizada do banco de dados
    update_environments(user_id, envs_data)
    return jsonify({"message": "Ambientes atualizados com sucesso!"}), 200