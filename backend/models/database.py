# Tabelas de Flashcards, Agenda e Métricas
import json
import os

# Arquivo JSON simples para persistência (sem precisar de banco de dados externo)
DB_FILE = os.path.join(os.path.dirname(__file__), 'db.json')

def _load():
    """Carrega o banco de dados do arquivo JSON."""
    if not os.path.exists(DB_FILE):
        return {"decks": [], "metrics": {"sessoes": 0, "flash_decks": 0, "retencao": 0}}
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def _save(data):
    """Salva o banco de dados no arquivo JSON."""
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def save_deck(title: str, cards: list):
    """Salva um baralho de flashcards no banco."""
    db = _load()
    db['decks'].append({'title': title, 'cards': cards})
    db['metrics']['flash_decks'] = len(db['decks'])
    _save(db)

def get_all_decks() -> list:
    """Retorna todos os baralhos salvos."""
    db = _load()
    return db.get('decks', [])

def get_metrics() -> dict:
    """Retorna as métricas do dashboard."""
    db = _load()
    return db.get('metrics', {})

