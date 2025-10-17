#!/usr/bin/env python3
"""Script de prueba para gTTS"""

print("🔊 Probando generación de audio con gTTS...\n")

try:
    from text_to_speech import generate_audio_for_sentence
    
    # Generar audios de prueba
    test_sentences = [
        ("Hello, this is a test.", "en"),
        ("Welcome to Tbodemy!", "en"),
        ("Hola, bienvenido a Tbodemy.", "es"),
    ]
    
    for sentence, lang in test_sentences:
        print(f"Generando: '{sentence}' (lang={lang})")
        audio_path = generate_audio_for_sentence(
            sentence=sentence,
            course_id=0,
            unit_order=0,
            lang=lang
        )
        print(f"  → {audio_path}\n")
    
    print("✅ ¡Audios generados exitosamente!")
    print("📁 Ver audios en: static/audio/course_0/\n")
    
except Exception as e:
    print(f"❌ Error: {e}")
