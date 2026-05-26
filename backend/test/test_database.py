import pytest
from unittest.mock import patch
from models.database import get_user_by_email, get_environments

# Simulando um banco de dados temporário em memória para o teste
MOCK_DB = {
    "users": [
        {"id": 1, "name": "Eduardo", "email": "eduardo@cin.ufpe.br", "password": "hash"}
    ],
    "user_environments": [
        {"user_id": 1, "envs": [{"type": "notion", "title": "Meu Notion", "url": "notion.so"}]}
    ]
}

@patch('models.database._load')
def test_deve_encontrar_usuario_por_email_existente(mock_load):
    # Força a função _load() do seu database.py a retornar o nosso MOCK_DB
    mock_load.return_value = MOCK_DB
    
    usuario = get_user_by_email("eduardo@cin.ufpe.br")
    
    assert usuario is not None
    assert usuario["name"] == "Eduardo"

@patch('models.database._load')
def test_deve_retornar_none_se_usuario_nao_existir(mock_load):
    mock_load.return_value = MOCK_DB
    
    usuario = get_user_by_email("inexistente@gmail.com")
    
    assert usuario is None

@patch('models.database._load')
def test_deve_retornar_ambientes_corretos_do_usuario(mock_load):
    mock_load.return_value = MOCK_DB
    
    envs = get_environments(1)
    
    assert len(envs) == 1
    assert envs[0]["type"] == "notion"
