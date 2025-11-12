"""
Servicio de OpenAI para funcionalidades de Speaking
Usa GPT-4, Whisper (STT) y TTS
"""
import os
from pathlib import Path
from typing import List, Dict
import openai
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Configurar OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY", "")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


# Directorio para guardar audios
AUDIO_DIR = Path("static/speaking")
AUDIO_DIR.mkdir(parents=True, exist_ok=True)


def generate_system_prompt(topic: str, conversation_type: str, difficulty_level: str) -> str:
    """
    Genera el prompt del sistema basado en los parámetros de la sesión
    """
    prompts = {
        "formal": "You are a professional English tutor conducting a formal conversation.",
        "informal": "You are a friendly English conversation partner having a casual chat.",
        "business": "You are a business English coach helping with professional communication.",
        "casual": "You are a relaxed conversation partner helping someone practice everyday English."
    }
    
    difficulty_instructions = {
        "beginner": "Use simple vocabulary and short sentences. Speak slowly and clearly. Avoid idioms and complex grammar.",
        "intermediate": "Use everyday vocabulary with some advanced words. Use varied sentence structures. You can use common idioms.",
        "advanced": "Use sophisticated vocabulary and complex sentence structures. Feel free to use idioms, phrasal verbs, and nuanced expressions."
    }
    
    base_prompt = prompts.get(conversation_type, prompts["casual"])
    difficulty = difficulty_instructions.get(difficulty_level, difficulty_instructions["intermediate"])
    
    return f"""{base_prompt}

Topic: {topic}
Level: {difficulty_level.upper()}

Instructions:
- {difficulty}
- Keep responses concise (2-4 sentences maximum).
- Ask engaging follow-up questions to keep the conversation flowing.
- Provide gentle corrections when the student makes significant errors, but focus on encouraging communication.
- Be supportive and encouraging.
- Adapt your language complexity to match the student's level.

Start the conversation by greeting the student and introducing the topic briefly."""


class STTQuotaExceededError(Exception):
    pass

def transcribe_audio(audio_file_path: str) -> str:
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcript = openai.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
        return transcript.text
    except Exception as e:
        # El SDK devuelve dict con code/type en el mensaje -> detectamos cuota
        msg = str(e)
        if "insufficient_quota" in msg or "code: 429" in msg or "You exceeded your current quota" in msg:
            # Lanzamos excepción específica para mapearla a 429
            raise STTQuotaExceededError("OpenAI STT quota exceeded") from e
        print(f"Error transcribing audio: {msg}")
        raise

def generate_response(messages: List[Dict[str, str]]) -> str:
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",   # ajusta al que tengas disponible
            messages=messages,
            max_tokens=200,
            temperature=0.7
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"Error generating response: {e}")
        raise

def text_to_speech(text: str, session_id: int, message_id: int) -> str:
    try:
        session_dir = AUDIO_DIR / f"session_{session_id}"
        session_dir.mkdir(exist_ok=True)
        audio_filename = f"message_{message_id}.mp3"
        audio_path = session_dir / audio_filename

        # Streaming a archivo (SDK nuevo)
        with client.audio.speech.with_streaming_response.create(
            model="gpt-4o-mini-tts",  # o "tts-1"
            voice="alloy",
            input=text
        ) as resp:
            resp.stream_to_file(str(audio_path))

        # Si montas estáticos en /speaking:
        return f"/static/speaking/session_{session_id}/{audio_filename}"
    except Exception as e:
        print(f"Error generating speech: {e}")
        raise

def get_conversation_history(messages: List[Dict]) -> List[Dict[str, str]]:
    """
    Formatea el historial de conversación para OpenAI
    """
    formatted_messages = []
    for msg in messages:
        formatted_messages.append({
            "role": msg["role"],
            "content": msg["content"]
        })
    return formatted_messages