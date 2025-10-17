#!/usr/bin/env python3
"""
Script para probar la generación de audio con Azure Speech
"""
import sys
import os

# Colores
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_warning(msg):
    print(f"{Colors.YELLOW}⚠ {msg}{Colors.END}")


print("\n" + "="*60)
print("  TBODEMY - TEST AZURE SPEECH")
print("="*60 + "\n")

# 1. Verificar que .env existe
print_info("1. Verificando archivo .env...")
if not os.path.exists('.env'):
    print_error("Archivo .env no encontrado")
    print_info("Crea un archivo .env con:")
    print("  AZURE_SPEECH_KEY=tu_clave_aqui")
    print("  AZURE_SPEECH_REGION=eastus")
    print("  AZURE_SPEECH_VOICE=en-US-JennyNeural")
    sys.exit(1)

print_success("Archivo .env encontrado")

# 2. Cargar variables de entorno
print_info("2. Cargando variables de entorno...")
from dotenv import load_dotenv
load_dotenv()

azure_key = os.getenv('AZURE_SPEECH_KEY')
azure_region = os.getenv('AZURE_SPEECH_REGION')
azure_voice = os.getenv('AZURE_SPEECH_VOICE')

if not azure_key:
    print_warning("AZURE_SPEECH_KEY no configurada")
    print_info("El sistema usará rutas placeholder")
    print_info("Para configurar Azure Speech, ver AZURE_SETUP.md")
else:
    print_success(f"Azure configurado: {azure_region}, voz: {azure_voice}")

# 3. Probar importación
print_info("3. Probando importación del servicio...")
try:
    from azure_speech import generate_audio_for_sentence, azure_speech_service
    print_success("Servicio de Azure Speech importado correctamente")
except ImportError as e:
    print_error(f"Error al importar: {e}")
    print_info("Instala el SDK: pip install azure-cognitiveservices-speech")
    sys.exit(1)

# 4. Verificar directorio de audios
print_info("4. Verificando directorio de audios...")
from pathlib import Path
audio_dir = Path("static/audio")
if not audio_dir.exists():
    audio_dir.mkdir(parents=True)
    print_success("Directorio de audios creado")
else:
    print_success("Directorio de audios existe")

# 5. Generar audio de prueba
if azure_key:
    print_info("5. Generando audio de prueba...")
    test_sentences = [
        "Hello, this is a test.",
        "Welcome to Tbodemy!",
        "Let's learn English together."
    ]
    
    for i, sentence in enumerate(test_sentences):
        print(f"\n  Generando: '{sentence}'")
        try:
            audio_path = generate_audio_for_sentence(
                sentence=sentence,
                course_id=0,
                unit_order=i
            )
            print_success(f"  Audio generado: {audio_path}")
        except Exception as e:
            print_error(f"  Error: {str(e)}")
    
    print("\n" + "="*60)
    print_success("¡Azure Speech está funcionando!")
    print_info("Los audios se generarán automáticamente al crear cursos")
    print("="*60 + "\n")
else:
    print("\n" + "="*60)
    print_warning("Azure Speech no configurado")
    print_info("Los cursos usarán rutas placeholder")
    print_info("Para habilitar Azure Speech:")
    print("  1. Ver AZURE_SETUP.md")
    print("  2. Configurar .env con tus credenciales")
    print("  3. Ejecutar este script de nuevo")
    print("="*60 + "\n")