# CIntetize 🧠

> Plataforma inteligente de otimização de estudos para vestibulares e concursos, com IA generativa integrada.

---

## ✨ Visão Geral

O **CIntetize** é uma aplicação web que combina organização e inteligência artificial para potencializar a rotina de estudos. Com ela, o estudante pode conversar com uma IA tutora, gerar flashcards automaticamente a partir de qualquer conteúdo, montar um cronograma semanal personalizado e centralizar seus ambientes de estudo — tudo em um só lugar.

**Stack:** Python + Flask (backend) · HTML / CSS / Vanilla JS (frontend) · Groq API com Llama 3.3 70B

---

## 🚀 Funcionalidades

| Módulo              | Descrição                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| 💬 **Chat com IA**  | Assistente pedagógico que responde dúvidas de qualquer disciplina       |
| 🃏 **Flashcards**   | Gera baralhos de perguntas e respostas a partir de um texto via IA      |
| 📅 **Planner**      | Cronograma semanal criado manualmente ou gerado automaticamente pela IA |
| 🌐 **Ambientes**    | Agregador de links e plataformas de estudo do usuário                   |
| 📊 **Dashboard**    | Painel com métricas e progresso de estudos                              |
| 🔐 **Autenticação** | Cadastro e login com dados persistidos por usuário                      |

---

## 🏗️ Arquitetura

```
Projeto-DS/
├── backend/
│   ├── app.py                  # Entry point — Flask + registro dos Blueprints
│   ├── requirements.txt        # Dependências Python
│   ├── routes/
│   │   ├── auth.py             # POST /api/auth/register | POST /api/auth/login
│   │   ├── chat.py             # POST /api/chat
│   │   ├── flashcards.py       # POST /api/flashcards/generate | GET /api/flashcards
│   │   ├── planner.py          # GET|POST /api/planner | POST /api/planner/generate
│   │   ├── environments.py     # GET|POST /api/environments
│   │   └── dashboard.py        # GET /api/dashboard
│   ├── services/
│   │   └── ai_service.py       # Integração com Groq (Llama 3.3 70B)
│   ├── models/
│   │   ├── database.py         # Camada de persistência (JSON local)
│   │   └── db.json             # Banco de dados local (gerado em runtime)
│   └── test/
│       ├── test_database.py    # Testes unitários
│       └── test_routes.py      # Testes de integração das rotas
│
├── frontend/
│   ├── index.html              # Dashboard principal
│   ├── login.html              # Tela de autenticação
│   ├── app.js                  # Lógica, requisições HTTP e DOM
│   ├── style.css               # Estilos do painel principal
│   └── login.css               # Estilos da tela de login
│
├── .env.example
└── README.md
```

---

## ⚙️ Instalação e execução

### Pré-requisitos

- Python 3.10+
- Uma chave de API gratuita do [Groq](https://console.groq.com)
- Navegador moderno (recomendado: extensão **Live Server** no VS Code)

### 1. Clone o repositório

```bash
git clone https://github.com/EduHenriqueRmc/Projeto-DS.git
cd Projeto-DS
```

### 2. Configure o backend

```bash
cd backend

# Crie e ative o ambiente virtual
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Instale as dependências
pip install -r requirements.txt
```

### 3. Configure as variáveis de ambiente

```bash
cp ../.env.example .env
```

Edite o arquivo `.env` gerado:

```env
GROQ_API_KEY=sua_chave_groq_aqui
```

> ⚠️ Nunca comite o arquivo `.env`. Ele já está no `.gitignore`.

### 4. Inicie o servidor

```bash
python app.py
```

Acesse `http://localhost:5000` no navegador. O servidor serve o frontend automaticamente.

---

## 🔌 Referência da API

### Autenticação

| Método | Rota                 | Descrição                            |
| ------ | -------------------- | ------------------------------------ |
| `POST` | `/api/auth/register` | Cadastra um novo usuário             |
| `POST` | `/api/auth/login`    | Autentica e retorna dados do usuário |

```bash
# Cadastro
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Pedro", "email": "pedro@email.com", "password": "123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "pedro@email.com", "password": "123456"}'
```

### Chat com IA

| Método | Rota        | Descrição                               |
| ------ | ----------- | --------------------------------------- |
| `POST` | `/api/chat` | Envia mensagem ao assistente de estudos |

```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "O que é uma derivada?"}'
```

### Flashcards

| Método | Rota                        | Descrição                                      |
| ------ | --------------------------- | ---------------------------------------------- |
| `POST` | `/api/flashcards/generate`  | Gera flashcards com IA a partir de um conteúdo |
| `GET`  | `/api/flashcards?user_id=1` | Lista os baralhos salvos do usuário            |

```bash
curl -X POST http://localhost:5000/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "title": "Cálculo 1", "content": "Um limite descreve o comportamento de uma função conforme o argumento se aproxima de um ponto..."}'
```

### Planner

| Método | Rota                     | Descrição                            |
| ------ | ------------------------ | ------------------------------------ |
| `GET`  | `/api/planner?user_id=1` | Retorna o cronograma do usuário      |
| `POST` | `/api/planner`           | Salva um cronograma manual           |
| `POST` | `/api/planner/generate`  | Gera cronograma personalizado com IA |

### Ambientes

| Método | Rota                          | Descrição                           |
| ------ | ----------------------------- | ----------------------------------- |
| `GET`  | `/api/environments?user_id=1` | Lista ambientes de estudo salvos    |
| `POST` | `/api/environments`           | Salva/atualiza ambientes do usuário |

### Dashboard

| Método | Rota             | Descrição                               |
| ------ | ---------------- | --------------------------------------- |
| `GET`  | `/api/dashboard` | Retorna métricas e progresso do usuário |

---

## 🧪 Testes

```bash
# Com o ambiente virtual ativado, dentro de /backend
pytest test/ -v
```

---

## 🤝 Contribuindo

### Estratégia de branches

| Branch         | Finalidade                                           |
| -------------- | ---------------------------------------------------- |
| `main`         | Código estável — só recebe merge após revisão via PR |
| `develop`      | Branch de integração contínua                        |
| `feature/nome` | Desenvolvimento de novas funcionalidades             |
| `fix/nome`     | Correções de bugs                                    |

### Fluxo de trabalho

```bash
git checkout develop && git pull
git checkout -b feature/minha-feature

# ... desenvolve e testa localmente ...

git add .
git commit -m "feat: descrição clara da mudança"
git push origin feature/minha-feature
# Abra um Pull Request para develop no GitHub
```

### Padrão de commits (Conventional Commits)

| Prefixo     | Uso                                      |
| ----------- | ---------------------------------------- |
| `feat:`     | Nova funcionalidade                      |
| `fix:`      | Correção de bug                          |
| `docs:`     | Alteração em documentação                |
| `refactor:` | Refatoração sem mudança de comportamento |
| `test:`     | Adição ou correção de testes             |
| `chore:`    | Tarefas de manutenção (deps, configs)    |

---

## 🛠️ Tecnologias

- **[Flask](https://flask.palletsprojects.com/)** — microframework web Python
- **[Groq API](https://groq.com/)** — inferência de alta velocidade com Llama 3.3 70B
- **[Flask-CORS](https://flask-cors.readthedocs.io/)** — controle de Cross-Origin Resource Sharing
- **[python-dotenv](https://pypi.org/project/python-dotenv/)** — gerenciamento de variáveis de ambiente
- **[Pytest](https://pytest.org/)** — framework de testes

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE` para mais informações.
