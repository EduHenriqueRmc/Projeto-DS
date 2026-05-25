from flask import Blueprint, request, jsonify
from models.database import get_user_by_email, add_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    nome = data.get('name')
    email = data.get('email')
    senha = data.get('password')

    if not email or not senha:
        return jsonify({"error": "Email e senha são obrigatórios."}), 400

    # REQUISITO 1: Verifica se o email já existe no banco
    usuario_existente = get_user_by_email(email)
    
    if usuario_existente:
        # Retorna erro 400 (Bad Request) avisando o frontend
        return jsonify({"error": "Esse e-mail já está cadastrado!"}), 400

    # REQUISITO 2: Se passar pela verificação, salva no banco de dados
    # Nota: Em um ambiente de produção real, você usaria uma biblioteca como 'werkzeug.security' para fazer o hash (criptografia) dessa senha antes de salvar.
    novo_usuario = add_user(email, senha, nome)
    
    return jsonify({
        "message": "Conta criada com sucesso!", 
        "user": {"id": novo_usuario["id"], "name": novo_usuario["name"], "email": novo_usuario["email"]}
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    senha = data.get('password')

    if not email or not senha:
        return jsonify({"error": "E-mail e senha são obrigatórios."}), 400

    # Puxa o usuário do banco de dados (função que criamos no database.py)
    usuario = get_user_by_email(email)
    
    # Verifica se o usuário existe E se a senha digitada é igual à salva no banco
    # Nota: Em um sistema real, usaríamos criptografia (ex: werkzeug.security)
    if not usuario or usuario.get('password') != senha:
        return jsonify({"error": "E-mail ou senha incorretos."}), 401

    # Se deu tudo certo, devolvemos um "Token" de acesso e os dados do usuário
    return jsonify({
        "message": "Login realizado com sucesso!",
        "token": "cintetize-jwt-token-simulado-123", # Simulando um JWT real
        "user": {"id": usuario["id"], "name": usuario["name"], "email": usuario["email"]}
    }), 200