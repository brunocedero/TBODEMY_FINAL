"""
Servicio de corrección gramatical usando OpenAI GPT-4 y LanguageTool
GPT-4 es más preciso para errores contextuales como tiempo verbal
"""
import requests
from typing import Optional, Dict, List
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Cliente OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))

# Usar el API público de LanguageTool (también puedes instalar el servidor localmente)
LANGUAGETOOL_API = "https://api.languagetool.org/v2/check"


def check_grammar_with_gpt(text: str, language: str = "en-US") -> dict:
    """
    Verifica y corrige gramática usando GPT-4 (más preciso que LanguageTool)
    
    Args:
        text: Texto a verificar
        language: Código de idioma (en-US, es, etc.)
    
    Returns:
        Dict con errores encontrados, texto corregido y explicaciones
    """
    try:
        prompt = f"""You are an English grammar expert. Analyze the following text and correct any grammatical errors.

Text to analyze: "{text}"

Provide your response in this exact JSON format (no additional text):
{{
    "has_errors": true/false,
    "corrected": "corrected text here",
    "errors": [
        {{
            "original": "incorrect phrase",
            "correction": "corrected phrase",
            "explanation": "brief explanation of the error"
        }}
    ]
}}

Rules:
- If there are NO errors, return: {{"has_errors": false, "corrected": "{text}", "errors": []}}
- Keep the corrected text natural and preserve the original meaning
- Focus on grammar, verb tenses, articles, prepositions, and word order
- Provide clear, brief explanations"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a precise English grammar checker. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )
        
        # Parse JSON response
        import json
        result_text = response.choices[0].message.content.strip()
        
        # Remove markdown code blocks if present
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        result = json.loads(result_text)
        
        return {
            'original': text,
            'corrected': result.get('corrected', text),
            'has_errors': result.get('has_errors', False),
            'errors': result.get('errors', []),
            'method': 'gpt-4'
        }
        
    except Exception as e:
        print(f"Error with GPT grammar check: {str(e)}")
        # Fallback to LanguageTool if GPT fails
        return check_grammar_with_languagetool(text, language)


def check_grammar_with_languagetool(text: str, language: str = "en-US") -> dict:
    """
    Verifica la gramática de un texto usando LanguageTool API (fallback)
    
    Args:
        text: Texto a verificar
        language: Código de idioma (en-US, es, etc.)
    
    Returns:
        Dict con errores encontrados y texto corregido
    """
    try:
        response = requests.post(
            LANGUAGETOOL_API,
            data={
                'text': text,
                'language': language,
            },
            timeout=5
        )
        
        if response.status_code == 200:
            result = response.json()
            return {
                'original': text,
                'corrected': apply_corrections(text, result['matches']),
                'matches': result['matches'],
                'has_errors': len(result['matches']) > 0,
                'method': 'languagetool'
            }
        else:
            return {
                'original': text,
                'corrected': text,
                'matches': [],
                'has_errors': False,
                'error': 'API error',
                'method': 'none'
            }
            
    except Exception as e:
        print(f"Error checking grammar with LanguageTool: {str(e)}")
        return {
            'original': text,
            'corrected': text,
            'matches': [],
            'has_errors': False,
            'error': str(e),
            'method': 'none'
        }


def check_grammar(text: str, language: str = "en-US") -> dict:
    """
    Función principal: usa GPT-4 por defecto, con fallback a LanguageTool
    
    Args:
        text: Texto a verificar
        language: Código de idioma (en-US, es, etc.)
    
    Returns:
        Dict con errores encontrados y texto corregido
    """
    return check_grammar_with_gpt(text, language)


def apply_corrections(text: str, matches: list) -> str:
    """
    Aplica las correcciones sugeridas al texto (para LanguageTool)
    """
    if not matches:
        return text
    
    # Ordenar matches por offset de manera descendente para aplicar de atrás hacia adelante
    sorted_matches = sorted(matches, key=lambda x: x['offset'], reverse=True)
    
    corrected_text = text
    for match in sorted_matches:
        if match['replacements']:
            # Usar la primera sugerencia
            replacement = match['replacements'][0]['value']
            offset = match['offset']
            length = match['length']
            
            corrected_text = (
                corrected_text[:offset] + 
                replacement + 
                corrected_text[offset + length:]
            )
    
    return corrected_text


def get_corrections_summary(errors: list) -> list:
    """
    Obtiene un resumen legible de las correcciones (formato GPT)
    """
    return errors


def get_corrections_summary_languagetool(matches: list) -> list:
    """
    Obtiene un resumen legible de las correcciones (formato LanguageTool)
    """
    corrections = []
    for match in matches:
        if match['replacements']:
            corrections.append({
                'error': match['context']['text'][match['context']['offset']:match['context']['offset'] + match['context']['length']],
                'suggestion': match['replacements'][0]['value'],
                'message': match['message'],
                'rule': match['rule']['id']
            })
    return corrections


def format_grammar_feedback(text: str, grammar_result: dict) -> str:
    """
    Formatea el feedback de gramática de manera amigable
    
    Args:
        text: Texto original
        grammar_result: Resultado de check_grammar()
    
    Returns:
        String con feedback formateado
    """
    if not grammar_result.get('has_errors', False):
        return "✅ ¡Perfecto! No hay errores gramaticales."
    
    feedback = f"👤 Tú: {text}\n"
    feedback += f"✨ Corrección sugerida: {grammar_result['corrected']}\n\n"
    
    if grammar_result.get('errors'):
        feedback += "📝 Errores detectados:\n"
        for i, error in enumerate(grammar_result['errors'], 1):
            feedback += f"{i}. '{error['original']}' → '{error['correction']}'\n"
            feedback += f"   💡 {error['explanation']}\n"
    
    return feedback