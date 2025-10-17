"""
Servicio de corrección gramatical usando LanguageTool
LanguageTool es una herramienta open-source de corrección gramatical
"""
import requests
from typing import Optional

# Usar el API público de LanguageTool (también puedes instalar el servidor localmente)
LANGUAGETOOL_API = "https://api.languagetool.org/v2/check"


def check_grammar(text: str, language: str = "en-US") -> dict:
    """
    Verifica la gramática de un texto usando LanguageTool API
    
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
                'has_errors': len(result['matches']) > 0
            }
        else:
            return {
                'original': text,
                'corrected': text,
                'matches': [],
                'has_errors': False,
                'error': 'API error'
            }
            
    except Exception as e:
        print(f"Error checking grammar: {str(e)}")
        return {
            'original': text,
            'corrected': text,
            'matches': [],
            'has_errors': False,
            'error': str(e)
        }


def apply_corrections(text: str, matches: list) -> str:
    """
    Aplica las correcciones sugeridas al texto
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


def get_corrections_summary(matches: list) -> list:
    """
    Obtiene un resumen legible de las correcciones
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