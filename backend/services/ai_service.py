import os
import json
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

SYSTEM_PROMPT = (
    "Você é o CIntetize, um assistente inteligente de estudos. "
    "Ajude estudantes que se preparam para vestibulares e concursos. "
    "Seja claro, pedagógico e objetivo nas respostas."
)

def ask_llama(user_message: str, json_mode: bool = False):
    """
    Envia uma mensagem para a Llama 3.3 via Groq e retorna a resposta.
    Se json_mode=True, faz parse do JSON retornado.
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1500,
        temperature=0.7,
    )

    content = response.choices[0].message.content

    if json_mode:
        # Remove blocos markdown (```json ... ```) se houver
        clean = re.sub(r"```(?:json)?", "", content).strip().rstrip("`").strip()
        return json.loads(clean)

    return content

def gerar_cronograma_inteligente(dados_usuario: dict) -> dict:
    """
    Chama a API do Groq para montar um cronograma de estudos estruturado em JSON.
    """
    
    # Você pode extrair preferências dos dados_usuario se o frontend enviar,
    # ou usar um prompt genérico por enquanto.
    preferencias = dados_usuario.get("preferencias", "Foque em um cronograma balanceado para um estudante de computação.")
    
    prompt_sistema = """
    Você é um assistente acadêmico especialista em organizar rotinas de estudo.
    Sua tarefa é criar um cronograma semanal de estudos.
    
    REGRAS OBRIGATÓRIAS:
    1. Você DEVE responder APENAS com um objeto JSON válido.
    2. Não inclua NENHUM texto antes ou depois do JSON.
    3. Use EXATAMENTE a estrutura abaixo:
    
    {
      "Seg": [
        { "time": "HH:MM - HH:MM", "title": "Nome da Matéria/Tarefa", "color": "task-blue" }
      ],
      "Ter": [],
      "Qua": [],
      "Qui": [],
      "Sex": [],
      "Sáb": [],
      "Dom": []
    }
    
    4. Para a chave "color", use APENAS os valores: "task-blue" (estudo normal), "task-purple" (revisão) ou "task-green" (projetos/prática).
    5. Preencha a semana com blocos lógicos baseados nesta preferência do aluno: """ + preferencias

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": prompt_sistema
                },
                {
                    "role": "user",
                    "content": "Gere meu cronograma de estudos para esta semana."
                }
            ],
            model="llama3-8b-8192", # Pode usar o llama-3.3-70b-versatile se preferir um modelo mais inteligente
            response_format={"type": "json_object"}
        )
        
        # Extrai o texto da resposta
        resposta_texto = chat_completion.choices[0].message.content
        
        # Converte a string JSON para um dicionário Python
        cronograma_json = json.loads(resposta_texto)
        
        return cronograma_json
        
    except Exception as e:
        print(f"Erro ao chamar o Groq: {e}")
        # Retorna um cronograma vazio por segurança caso a API falhe
        return {
            "Seg": [], "Ter": [], "Qua": [], "Qui": [], "Sex": [], "Sáb": [], "Dom": []
        }
