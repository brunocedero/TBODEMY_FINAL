"""
Servicio de Azure Speech para convertir texto a audio
"""
import os
import azure.cognitiveservices.speech as speechsdk
from pathlib import Path
import hashlib
from typing import Optional

# Configuración desde variables de entorno
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "eastus")
AZURE_SPEECH_VOICE = os.getenv("AZURE_SPEECH_VOICE", "en-US-JennyNeural")

# Directorio base para guardar audios
AUDIO_BASE_DIR = Path("static/audio")


class AzureSpeechService:
    """Servicio para generar audios usando Azure Speech"""
    
    def __init__(self):
        if not AZURE_SPEECH_KEY:
            raise ValueError("AZURE_SPEECH_KEY no está configurada en .env")
        
        # Configurar Azure Speech
        self.speech_config = speechsdk.SpeechConfig(
            subscription=AZURE_SPEECH_KEY,
            region=AZURE_SPEECH_REGION
        )
        
        # Configurar voz
        self.speech_config.speech_synthesis_voice_name = AZURE_SPEECH_VOICE
        
        # Crear directorio de audios si no existe
        AUDIO_BASE_DIR.mkdir(parents=True, exist_ok=True)
    
    def generate_audio_filename(self, text: str, course_id: int, unit_order: int) -> str:
        """
        Genera un nombre de archivo único basado en el texto
        
        Args:
            text: Texto a convertir
            course_id: ID del curso
            unit_order: Orden de la unidad
            
        Returns:
            Nombre del archivo (sin extensión)
        """
        # Crear hash del texto para nombre único
        text_hash = hashlib.md5(text.encode()).hexdigest()[:8]
        
        # Nombre del archivo: course_{id}_unit_{order}_{hash}
        filename = f"course_{course_id}_unit_{unit_order}_{text_hash}"
        
        return filename
    
    def text_to_speech(
        self, 
        text: str, 
        course_id: int, 
        unit_order: int,
        voice_name: Optional[str] = None
    ) -> str:
        """
        Convierte texto a audio y guarda el archivo
        
        Args:
            text: Texto a convertir en audio
            course_id: ID del curso
            unit_order: Orden de la unidad
            voice_name: Nombre de la voz (opcional)
            
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
                return f"/audio/course_{course_id}/{filename}.mp3"
            
            # Configurar voz si se especificó
            if voice_name:
                self.speech_config.speech_synthesis_voice_name = voice_name
            
            # Configurar salida a archivo
            audio_config = speechsdk.audio.AudioOutputConfig(
                filename=str(audio_file_path)
            )
            
            # Crear sintetizador
            synthesizer = speechsdk.SpeechSynthesizer(
                speech_config=self.speech_config,
                audio_config=audio_config
            )
            
            # Sintetizar el texto
            result = synthesizer.speak_text_async(text).get()
            
            # Verificar resultado
            if result.reason == speechsdk.ResultReason.SynthesizingAudioCompleted:
                print(f"✓ Audio generado: {audio_file_path}")
                return f"/audio/course_{course_id}/{filename}.mp3"
            
            elif result.reason == speechsdk.ResultReason.Canceled:
                cancellation = result.cancellation_details
                print(f"✗ Error al generar audio: {cancellation.reason}")
                if cancellation.reason == speechsdk.CancellationReason.Error:
                    print(f"  Detalles: {cancellation.error_details}")
                raise Exception(f"Error en Azure Speech: {cancellation.error_details}")
            
        except Exception as e:
            print(f"✗ Error al generar audio: {str(e)}")
            raise
    
    def text_to_speech_batch(
        self,
        texts: list[str],
        course_id: int,
        unit_order: int,
        voice_name: Optional[str] = None
    ) -> list[str]:
        """
        Convierte múltiples textos a audio
        
        Args:
            texts: Lista de textos a convertir
            course_id: ID del curso
            unit_order: Orden de la unidad
            voice_name: Nombre de la voz (opcional)
            
        Returns:
            Lista de rutas de archivos generados
        """
        audio_paths = []
        
        for text in texts:
            try:
                audio_path = self.text_to_speech(
                    text=text,
                    course_id=course_id,
                    unit_order=unit_order,
                    voice_name=voice_name
                )
                audio_paths.append(audio_path)
            except Exception as e:
                print(f"✗ Error al procesar '{text[:30]}...': {str(e)}")
                # Continuar con los demás aunque uno falle
                audio_paths.append(None)
        
        return audio_paths


# Instancia global del servicio
try:
    azure_speech_service = AzureSpeechService()
except ValueError as e:
    print(f"⚠️  Advertencia: {e}")
    print("   El servicio de Azure Speech no estará disponible")
    azure_speech_service = None


def generate_audio_for_sentence(
    sentence: str,
    course_id: int,
    unit_order: int,
    voice_name: Optional[str] = None
) -> str:
    """
    Función auxiliar para generar audio de una frase
    
    Args:
        sentence: Frase a convertir
        course_id: ID del curso
        unit_order: Orden de la unidad
        voice_name: Voz a usar (opcional)
        
    Returns:
        Ruta del archivo de audio
    """
    if azure_speech_service is None:
        # Si Azure no está configurado, retornar ruta por defecto
        return f"/audio/default/placeholder.mp3"
    
    return azure_speech_service.text_to_speech(
        text=sentence,
        course_id=course_id,
        unit_order=unit_order,
        voice_name=voice_name
    )