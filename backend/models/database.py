import json
import os
import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

def _load():
    if not os.path.exists(DB_FILE):
        # ⚙️ Estrutura expandida para suportar todo o app
        return {
            "users": [], 
            "decks": [], 
            "metrics": {"sessoes": 0, "flash_decks": 0, "retencao": 0},
            "planner_tasks": {
                "Seg": [], "Ter": [], "Qua": [], "Qui": [], "Sex": [], "Sáb": [], "Dom": []
            },
            "environments": []
        }
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# --- FLASHCARDS & METRICS ---
def save_deck(user_id: int, title: str, cards: list):
    """Salva um baralho de flashcards associado a um user_id específico."""
    db = _load()
    
    # Criamos o novo deck contendo o ID do dono
    new_deck = {
        "user_id": user_id,
        "title": title,
        "cards": cards
    }
    
    db['decks'].append(new_deck)
    
    # Filtra quantos decks totais o usuário específico tem para atualizar a métrica dele
    user_decks = [d for d in db['decks'] if d.get('user_id') == user_id]
    db['metrics']['flash_decks'] = len(user_decks) # Nota: futuramente podemos aninhar as métricas por usuário também!
    
    _save(db)
    return new_deck

def get_all_decks(user_id: int) -> list:
    """Retorna apenas os baralhos salvos que pertencem ao user_id informado."""
    db = _load()
    all_decks = db.get('decks', [])
    
    # Filtra para trazer apenas os registros onde o user_id seja igual
    return [deck for deck in all_decks if deck.get('user_id') == user_id]

def get_metrics() -> dict:
    return _load().get('metrics', {})

# --- CRONOGRAMA VINCULADO AO USUÁRIO ---

def get_planner(user_id: int) -> dict:
    """Retorna o cronograma semanal específico do user_id. Se não existir, retorna a estrutura vazia."""
    db = _load()
    
    # Se a chave 'planners' não existir no JSON antigo, inicializa ela
    if 'planners' not in db:
        db['planners'] = []
        
    # Procura se já existe um cronograma para este usuário
    for p in db['planners']:
        if p.get('user_id') == user_id:
            return p.get('week', {
                "Seg": [], "Ter": [], "Qua": [], "Qui": [], "Sex": [], "Sáb": [], "Dom": []
            })
            
    # Se for um usuário novo sem cronograma, retorna a estrutura padrão vazia
    return {
        "Seg": [], "Ter": [], "Qua": [], "Qui": [], "Sex": [], "Sáb": [], "Dom": []
    }

def update_planner(user_id: int, planner_data: dict):
    """Atualiza ou insere o cronograma semanal de um usuário específico."""
    db = _load()
    if 'planners' not in db:
        db['planners'] = []
        
    atualizado = False
    # Procura o registro do usuário para atualizar os dados existentes
    for p in db['planners']:
        if p.get('user_id') == user_id:
            p['week'] = planner_data
            atualizado = True
            break
            
    # Se o usuário não tinha nenhum cronograma salvo, adiciona um registro novo
    if not atualizado:
        db['planners'].append({
            "user_id": user_id,
            "week": planner_data
        })
        
    _save(db)

# --- AMBIENTES DE ESTUDO ---
def get_environments(user_id: int) -> list:
    """Retorna os ambientes de estudo de um usuário. Se não existirem, retorna os padrões."""
    db = _load()
    
    if 'user_environments' not in db:
        db['user_environments'] = []
        
    for e in db['user_environments']:
        if e.get('user_id') == user_id:
            return e.get('envs', [])
            
    # Lista padrão inicial para novos usuários
    return [
        { 'type': 'notion', 'title': 'Notion Central', 'url': 'https://notion.so' },
        { 'type': 'drive', 'title': 'Google Drive Integrado', 'url': 'https://drive.google.com' },
        { 'type': 'youtube', 'title': 'Aulas Complementares', 'url': 'https://youtube.com' }
    ]

def update_environments(user_id: int, envs_data: list):
    """Atualiza ou insere a lista de ambientes de estudo de um usuário específico."""
    db = _load()
    
    if 'user_environments' not in db:
        db['user_environments'] = []
        
    atualizado = False
    for e in db['user_environments']:
        if e.get('user_id') == user_id:
            e['envs'] = envs_data
            atualizado = True
            break
            
    if not atualizado:
        db['user_environments'].append({
            "user_id": user_id,
            "envs": envs_data
        })
        
    _save(db)
    
# --- USUÁRIOS (Exemplo Básico) ---
def add_user(email: str, password_hash: str, name: str):
    db = _load()
    new_user = {"id": len(db['users']) + 1, "email": email, "password": password_hash, "name": name}
    db['users'].append(new_user)
    _save(db)
    return new_user

def get_user_by_email(email: str):
    db = _load()
    for user in db.get('users', []):
        if user['email'] == email:
            return user
    return None

def save_file(user_id: int, filename: str, content: str, file_type: str = 'txt') -> dict:
    """Salva um arquivo importado pelo usuário no banco de dados."""
    db = _load()

    if 'files' not in db:
        db['files'] = []

    # Gera um ID único simples baseado no tamanho atual da lista
    new_id = max((f['id'] for f in db['files']), default=0) + 1

    new_file = {
        "id": new_id,
        "user_id": user_id,
        "filename": filename,
        "type": file_type,
        "content": content,
        "created_at": datetime.datetime.now().isoformat()
    }

    db['files'].append(new_file)
    _save(db)
    return new_file


def get_all_files(user_id: int) -> list:
    """Retorna todos os arquivos importados de um usuário. O conteúdo é omitido para não sobrecarregar a listagem."""
    db = _load()
    all_files = db.get('files', [])

    # Retorna metadados (sem o 'content') para a listagem ser leve
    return [
        {k: v for k, v in f.items() if k != 'content'}
        for f in all_files
        if f.get('user_id') == user_id
    ]


def get_file_content(user_id: int, file_id: int) -> dict | None:
    """Retorna um arquivo específico com seu conteúdo completo."""
    db = _load()
    for f in db.get('files', []):
        if f.get('id') == file_id and f.get('user_id') == user_id:
            return f
    return None


def delete_file(user_id: int, file_id: int) -> bool:
    """Remove um arquivo do banco. Retorna True se removeu, False se não achou."""
    db = _load()

    if 'files' not in db:
        return False

    original_len = len(db['files'])
    # Mantém tudo EXCETO o arquivo cujo id bate E pertence ao usuário
    db['files'] = [
        f for f in db['files']
        if not (f.get('id') == file_id and f.get('user_id') == user_id)
    ]

    if len(db['files']) == original_len:
        return False  # Nada foi removido

    _save(db)
    return True


# --- ANOTAÇÕES MANUAIS ---

def save_annotation(user_id: int, text: str, file_id: int = None) -> dict:
    """Salva uma anotação manual. Pode estar vinculada a um arquivo (file_id) ou ser solta."""
    db = _load()

    if 'annotations' not in db:
        db['annotations'] = []

    new_id = max((a['id'] for a in db['annotations']), default=0) + 1

    new_annotation = {
        "id": new_id,
        "user_id": user_id,
        "file_id": file_id,  # None = nota solta; int = vinculada a um arquivo
        "text": text,
        "created_at": datetime.datetime.now().isoformat(),
        "updated_at": datetime.datetime.now().isoformat()
    }

    db['annotations'].append(new_annotation)
    _save(db)
    return new_annotation


def get_annotations(user_id: int, file_id: int = None) -> list:
    """
    Retorna anotações do usuário.
    Se file_id for informado, filtra apenas as anotações daquele arquivo.
    """
    db = _load()
    all_annotations = db.get('annotations', [])

    result = [a for a in all_annotations if a.get('user_id') == user_id]

    if file_id is not None:
        result = [a for a in result if a.get('file_id') == file_id]

    return result


def update_annotation(user_id: int, annotation_id: int, new_text: str) -> dict | None:
    """Edita o texto de uma anotação existente. Retorna a anotação atualizada ou None."""
    db = _load()

    for a in db.get('annotations', []):
        if a.get('id') == annotation_id and a.get('user_id') == user_id:
            a['text'] = new_text
            a['updated_at'] = datetime.datetime.now().isoformat()
            _save(db)
            return a

    return None  # Não encontrou


def delete_annotation(user_id: int, annotation_id: int) -> bool:
    """Remove uma anotação. Retorna True se removeu, False se não achou."""
    db = _load()

    if 'annotations' not in db:
        return False

    original_len = len(db['annotations'])
    db['annotations'] = [
        a for a in db['annotations']
        if not (a.get('id') == annotation_id and a.get('user_id') == user_id)
    ]

    if len(db['annotations']) == original_len:
        return False

    _save(db)
    return True