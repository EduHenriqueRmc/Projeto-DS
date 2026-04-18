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
