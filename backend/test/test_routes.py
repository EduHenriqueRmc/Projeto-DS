import pytest
from app import app  # Importa o seu app Flask principal

@pytest.fixture
def client():
    """Configura um cliente de teste do Flask antes de rodar os testes."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_rota_environments_deve_falhar_se_nao_enviar_user_id(client):
    # Simula um GET /api/environments sem parâmetros
    response = client.get('/api/environments')
    
    assert response.status_code == 400
    assert "Usuário não identificado" in response.get_json()["error"]

def test_rota_login_deve_rejeitar_campos_vazios(client):
    # Simula um POST com JSON incompleto
    response = client.post('/api/auth/login', json={"email": ""})
    
    assert response.status_code == 400
