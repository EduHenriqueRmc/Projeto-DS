from flask import Blueprint, request, jsonify
from models.database import get_planner, update_planner
from services.ai_service import gerar_cronograma_inteligente # Função que chama o Groq

planner_bp = Blueprint('planner', __name__)

@planner_bp.route('/planner', methods=['GET'])
def get_plan():
    # 1. Pega o ID do usuário que veio na URL (ex: /api/planner?user_id=1)
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"error": "Usuário não identificado."}), 400
        
    # 2. Retorna apenas o cronograma daquele usuário
    planner_data = get_planner(user_id)
    return jsonify({"planner": planner_data}), 200

@planner_bp.route('/planner', methods=['POST'])
def save_manual_plan():
    data = request.json
    user_id = data.get('user_id')
    planner_data = data.get('planner')
    
    # 1. Verifica se os dados chegaram corretamente
    if not user_id or planner_data is None:
        return jsonify({"error": "Dados incompletos para salvar."}), 400
        
    # 2. Atualiza o banco de dados vinculando ao ID
    update_planner(user_id, planner_data)
    return jsonify({"message": "Cronograma salvo!"}), 200

@planner_bp.route('/planner/generate', methods=['POST'])
def generate_ai_plan():
    dados_usuario = request.json 
    user_id = dados_usuario.get('user_id')
    
    # 1. Trava de segurança para usuários não logados
    if not user_id:
        return jsonify({"error": "Usuário não autenticado."}), 401
        
    try:
        # 2. Chama o Groq lá da pasta services/
        novo_cronograma_json = gerar_cronograma_inteligente(dados_usuario) 
        
        # 3. Salva no banco de dados local vinculado ao usuário
        update_planner(user_id, novo_cronograma_json)
        
        # 4. Devolve para o frontend renderizar (usando a chave 'planner' esperada pelo app.js)
        return jsonify({"planner": novo_cronograma_json}), 200
    except Exception as e:
        return jsonify({"error": f"Erro ao gerar cronograma: {str(e)}"}), 500