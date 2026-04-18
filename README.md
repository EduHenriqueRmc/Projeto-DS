# CIntetize — Sprint 2

Plataforma de estudos com IA generativa para vestibulares e concursos.  
**Stack:** Python + Flask (backend) | HTML / CSS / JS (frontend)

---

## Estrutura do projeto

```
Projeto-DS/
├── backend/
│   ├── app.py                  # Entry point — Flask + registro de rotas
│   ├── requirements.txt        # Dependências Python
│   ├── routes/
│   │   ├── chat.py             # POST /api/chat
│   │   ├── flashcards.py       # POST /api/flashcards/generate | GET /api/flashcards
│   │   └── dashboard.py        # GET /api/dashboard
│   ├── services/
│   │   └── ai_service.py       # Integração com Groq (Llama 3.3)
│   └── models/
│       └── database.py         # Persistência em JSON local
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
├── .gitignore
└── README.md
```

---

## Instalação e execução

```bash
# 1. Entre na pasta do backend
cd backend

# 2. Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# 3. Instale as dependências
pip install -r requirements.txt

# 4. Configure a chave da API
cp ../.env.example .env
# Edite o arquivo .env e cole sua chave Groq

# 5. Rode o servidor
python app.py
```

Acesse `http://localhost:5000` no navegador.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/chat` | Envia mensagem ao AI Assistant |
| POST | `/api/flashcards/generate` | Gera flashcards com IA |
| GET | `/api/flashcards` | Lista baralhos salvos |
| GET | `/api/dashboard` | Retorna métricas do usuário |

### Exemplo — Chat
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "O que é uma derivada?"}'
```

### Exemplo — Flashcards
```bash
curl -X POST http://localhost:5000/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{"title": "Cálculo 1", "content": "Um limite descreve o comportamento de uma função..."}'
```

---

## Configuração do `.env`

```
GROQ_API_KEY=sua_chave_groq_aqui
```

> ⚠️ Nunca comite o arquivo `.env`. Ele já está no `.gitignore`.

---

## Regras de contribuição

### Branches
| Branch | Uso |
|--------|-----|
| `main` | Código estável — só recebe merge após revisão |
| `develop` | Integração contínua |
| `feature/nome` | Desenvolvimento de cada feature |
| `fix/nome` | Correção de bugs |

### Fluxo
```bash
git checkout develop && git pull
git checkout -b feature/minha-feature
# ... desenvolve ...
git add . && git commit -m "feat: descrição"
git push origin feature/minha-feature
# Abre Pull Request para develop
```

### Padrão de commits
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `refactor:` refatoração
