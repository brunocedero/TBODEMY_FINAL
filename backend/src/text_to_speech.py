"""
Servicio de Text-to-Speech usando gTTS (Google Text-to-Speech)
Alternativa simple a Azure Speech sin dependencias del sistema
"""
import os
from pathlib import Path
import hashlib
from typing import Optional
from gtts import gTTS

# Directorio base para guardar audios
AUDIO_BASE_DIR = Path("static/audio")


class TextToSpeechService:
    """Servicio para generar audios usando gTTS"""
    
    def __init__(self):
        # Crear directorio de audios si no existe
        AUDIO_BASE_DIR.mkdir(parents=True, exist_ok=True)
        print("✓ Servicio de Text-to-Speech inicializado (gTTS)")
    
    def generate_audio_filename(self, text: str, course_id: int, unit_order: int) -> str:
        """
        Genera un nombre de archivo único basado en el texto
        """
        # Crear hash del texto para nombre único
        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
        
        # Nombre del archivo
        filename = f"course_{course_id}_unit_{unit_order}_{text_hash}"
        
        return filename
    
    def text_to_speech(
        self, 
        text: str, 
        course_id: int, 
        unit_order: int,
        lang: str = 'en'
    ) -> str:
        """
        Convierte texto a audio y guarda el archivo
        
        Args:
            text: Texto a convertir en audio
            course_id: ID del curso
            unit_order: Orden de la unidad
            lang: Idioma (en, es, fr, de, etc.)
            
        Returns:
            Ruta relativa del archivo de audio generado
        """
        try:
            # Generar nombre de archivo
            filename = self.generate_audio_filename(text, course_id, unit_order)
            
            # Crear subdirectorio para el curso
            course_dir = AUDIO_BASE_DIR / f"course_{course_id}"
            course_dir.mkdir(parents=True, exist_ok=True)
            
            # Ruta completa del archivo
            audio_file_path = course_dir / f"{filename}.mp3"
            
            # Si el archivo ya existe, retornar la ruta
            if audio_file_path.exists():
                print(f"✓ Audio ya existe (cache): {audio_file_path.name}")
                return f"/audio/course_{course_id}/{filename}.mp3"
            
            # Generar audio con gTTS
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(str(audio_file_path))
            
            print(f"✓ Audio generado: {audio_file_path.name}")
            return f"/audio/course_{course_id}/{filename}.mp3"
            
        except Exception as e:
            print(f"✗ Error al generar audio: {str(e)}")
            # Retornar ruta placeholder en caso de error
            return f"/audio/placeholder/{unit_order}.mp3"


# Instancia global del servicio
tts_service = TextToSpeechService()


def generate_audio_for_sentence(
    sentence: str,
    course_id: int,
    unit_order: int,
    lang: str = 'en'
) -> str:
    """
    Función auxiliar para generar audio de una frase
    
    Args:
        sentence: Frase a convertir
        course_id: ID del curso
        unit_order: Orden de la unidad
        lang: Idioma ('en' para inglés, 'es' para español)
        
    Returns:
        Ruta del archivo de audio
    """
    return tts_service.text_to_speech(
        text=sentence,
        course_id=course_id,
        unit_order=unit_order,
        lang=lang
    )