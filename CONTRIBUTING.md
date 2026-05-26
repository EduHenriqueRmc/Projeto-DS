# 📖 Manual do Desenvolvedor - Projeto CIntetize

## 1. Visão Geral do Projeto

O **CIntetize** é uma plataforma de otimização de estudos voltada para estudantes. O sistema oferece ferramentas como criação automatizada de Flashcards via Inteligência Artificial, um Cronograma Semanal (Planner) inteligente e um agregador de Ambientes de Estudo.

A arquitetura é dividida em um **Frontend** leve (HTML, CSS e Vanilla JavaScript) focado em performance, e um **Backend** em Python utilizando o microframework Flask, responsável pelas regras de negócio, autenticação, persistência de dados e integração com a API de IA generativa (Groq/Llama).

---

## 2. Estrutura de Pastas

O repositório segue uma separação clara entre cliente e servidor, baseada no padrão MVC simplificado no backend.

```text
Projeto-DS/
├── backend/                  # Código-fonte do servidor Flask
│   ├── models/               # Camada de manipulação de dados
│   │   ├── database.py       # Lógica de I/O do banco de dados
│   │   └── db.json           # Banco de dados local atual (NoSQL/Documentos)
│   ├── routes/               # Controladores da API (Blueprints)
│   │   ├── auth.py           # Login e Cadastro
│   │   ├── chat.py           # Interface de mensagens com a IA
│   │   ├── dashboard.py      # Métricas e dados da tela inicial
│   │   ├── environments.py   # Gestão de links e plataformas
│   │   ├── flashcards.py     # Geração e salvamento de baralhos
│   │   └── planner.py        # Cronograma de estudos manual e IA
│   ├── services/             # Lógica externa e integrações
│   │   └── ai_service.py     # Integração direta com a API do Groq
│   ├── test/                 # Suíte de testes automatizados
│   │   ├── test_database.py  # Testes unitários do banco
│   │   └── test_routes.py    # Testes de integração das rotas Flask
│   ├── venv/                 # Ambiente virtual Python (ignorado no Git)
│   ├── *.sql                 # Scripts de migração futura para banco Relacional
│   ├── .env                  # Variáveis de ambiente secretas
│   ├── app.py                # Ponto de entrada do servidor Flask
│   └── requirements.txt      # Dependências do projeto (Flask, Pytest, etc.)
│
├── frontend/                 # Interface do usuário
│   ├── login/                # Componentes específicos de autenticação
│   ├── app.js                # Lógica principal, requisições HTTP e manipulação do DOM
│   ├── index.html            # Dashboard e painel principal
│   ├── login.html            # Tela de autenticação
│   └── style.css / login.css # Folhas de estilo padronizadas (tons de verde)
│
├── .gitignore                # Regras de exclusão do Git
└── README.md                 # Documentação principal

```

---

## 3. Como Configurar o Ambiente Local

Como o projeto utiliza tecnologias independentes para Front e Back, é necessário rodar ambos para o funcionamento completo.

### Pré-requisitos

* Python 3.10+
* Navegador moderno e extensão Live Server (VS Code)

### Passo a passo (Linux/Ubuntu)

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd Projeto-DS

```


2. **Configuração do Backend:**
Abra um terminal na pasta raiz e execute:
```bash
cd backend
python3 -m venv venv              # Cria o ambiente virtual
source venv/bin/activate          # Ativa o ambiente
pip install -r requirements.txt   # Instala as bibliotecas

```


3. **Variáveis de Ambiente:**
Crie uma cópia do arquivo `.env.example` renomeando-o para `.env` dentro da pasta `backend/`. Adicione a sua chave da API da IA:
```text
GROQ_API_KEY=sua_chave_aqui

```


4. **Iniciando o Servidor:**
```bash
python app.py

```


*O backend estará rodando em `http://localhost:5000`.*
5. **Iniciando o Frontend:**
No VS Code, clique com o botão direito no arquivo `frontend/login.html` e selecione **"Open with Live Server"**. Crie uma conta e acesse o sistema.

---

## 4. Banco de Dados

### Estado Atual (JSON Based)

Atualmente, para garantir agilidade no desenvolvimento e prototipação, o sistema utiliza um banco de dados baseado em arquivos locais (`backend/models/db.json`).
A arquitetura de dados simula coleções NoSQL, onde todos os registros (`flashcards`, `planners`, `environments`) estão rigidamente vinculados ao ID único do usuário (`user_id`), garantindo o isolamento total dos dados entre diferentes contas.

### Futuro (Migração SQL)

Conforme documentado pelos arquivos `.sql` na raiz do backend (`users.sql`, `sessions.sql`, `conversations.sql`), o projeto possui um plano de migração estruturado para um banco de dados relacional robusto (como PostgreSQL ou MySQL). Essa transição permitirá relacionamentos complexos, integridade referencial nativa e suporte a histórico de chats persistente em larga escala.

---

## 5. Rotas da API (Endpoints)

O backend expõe uma API RESTful modularizada através dos Blueprints do Flask. Todas as rotas base são prefixadas por `/api`.

| Módulo | Método | Rota | Descrição |
| --- | --- | --- | --- |
| **Auth** | `POST` | `/api/auth/register` | Cria uma nova conta com senha criptografada (hash). |
| **Auth** | `POST` | `/api/auth/login` | Autentica o usuário e retorna o token de sessão. |
| **Flashcards** | `GET` | `/api/flashcards?user_id=X` | Retorna todos os baralhos do usuário X. |
| **Flashcards** | `POST` | `/api/flashcards/generate` | Recebe conteúdo, gera via IA e salva no ID do usuário. |
| **Planner** | `GET` | `/api/planner?user_id=X` | Retorna o cronograma semanal do usuário. |
| **Planner** | `POST` | `/api/planner` | Sincroniza adições/remoções manuais de blocos. |
| **Planner** | `POST` | `/api/planner/generate` | Gera e salva uma nova grade horária inteligente com IA. |
| **Environments** | `GET` | `/api/environments?user_id=X` | Lista os links de estudo fixados. |
| **Environments** | `POST` | `/api/environments` | Atualiza a lista de ambientes do usuário. |

*(Nota: O frontend deve obrigatoriamente enviar o `user_id` capturado do `localStorage` no corpo (`body`) das requisições POST ou via Query Params nas requisições GET).*

---

## 6. Testes Automatizados

A garantia de qualidade do sistema é mantida através de testes unitários e de integração utilizando o framework **Pytest**. Os arquivos de teste estão isolados na pasta `backend/test/`.

* **`test_database.py`**: Garante o funcionamento seguro das funções de leitura e gravação no banco de dados, utilizando `Mocks` para simular o JSON sem corromper os dados reais de desenvolvimento.
* **`test_routes.py`**: Utiliza o cliente de testes nativo do Flask para bater nos endpoints HTTP simulando requisições reais do frontend, verificando validações, códigos de status (ex: 400 Bad Request) e consistência das respostas JSON.

### Como rodar os testes

Certifique-se de estar com a `venv` ativada e execute no terminal dentro da pasta `backend`:

```bash
pytest

```

O framework vasculhará todas as funções com o prefixo `test_` e exibirá um relatório indicando quais rotinas passaram (Verde) e se alguma regressão ou quebra de código foi identificada (Vermelho).
