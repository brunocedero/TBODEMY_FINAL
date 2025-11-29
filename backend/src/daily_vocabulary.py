"""
Daily vocabulary organized by themes
Each day shows a different lesson
"""
from datetime import datetime
from typing import Dict, List

DAILY_LESSONS = [
    {
        "id": 1,
        "theme": "✈️ Travel - Airport",
        "words": [
            {
                "word": "boarding pass",
                "translation": "tarjeta de embarque",
                "explanation": "The document you need to show to board the plane",
                "example": "Don't forget your boarding pass at the gate.",
                "example_es": "No olvides tu tarjeta de embarque en la puerta."
            },
            {
                "word": "luggage",
                "translation": "equipaje",
                "explanation": "The bags and suitcases you carry when traveling",
                "example": "Please check in your luggage at the counter.",
                "example_es": "Por favor registra tu equipaje en el mostrador."
            },
            {
                "word": "delayed",
                "translation": "retrasado/demorado",
                "explanation": "When something doesn't happen on time",
                "example": "I'm sorry, your flight has been delayed.",
                "example_es": "Lo siento, su vuelo ha sido retrasado."
            }
        ]
    },
    {
        "id": 2,
        "theme": "🍽️ Restaurant",
        "words": [
            {
                "word": "reservation",
                "translation": "reservación/reserva",
                "explanation": "Booking a table in advance",
                "example": "I'd like to make a reservation for two people.",
                "example_es": "Me gustaría hacer una reservación para dos personas."
            },
            {
                "word": "appetizer",
                "translation": "entrada/aperitivo",
                "explanation": "Light food served before the main course",
                "example": "Would you like an appetizer before your meal?",
                "example_es": "¿Desea una entrada antes de su comida?"
            },
            {
                "word": "bill",
                "translation": "cuenta",
                "explanation": "The paper showing how much you need to pay",
                "example": "Can I have the bill, please?",
                "example_es": "¿Me trae la cuenta, por favor?"
            }
        ]
    },
    {
        "id": 3,
        "theme": "🏨 Hotel",
        "words": [
            {
                "word": "check-in",
                "translation": "registro de entrada",
                "explanation": "The process of registering when you arrive at a hotel",
                "example": "What time is check-in?",
                "example_es": "¿A qué hora es el registro de entrada?"
            },
            {
                "word": "amenities",
                "translation": "servicios/comodidades",
                "explanation": "Extra features offered by the hotel (wifi, pool, gym, etc.)",
                "example": "This hotel has great amenities like a pool and gym.",
                "example_es": "Este hotel tiene excelentes servicios como piscina y gimnasio."
            },
            {
                "word": "room service",
                "translation": "servicio a la habitación",
                "explanation": "When food is brought directly to your room",
                "example": "I'd like to order room service.",
                "example_es": "Me gustaría ordenar servicio a la habitación."
            }
        ]
    },
    {
        "id": 4,
        "theme": "🛍️ Shopping",
        "words": [
            {
                "word": "discount",
                "translation": "descuento",
                "explanation": "A reduction from the original price",
                "example": "Is there any discount on this item?",
                "example_es": "¿Hay algún descuento en este artículo?"
            },
            {
                "word": "fitting room",
                "translation": "probador",
                "explanation": "Place where you try on clothes before buying",
                "example": "Where's the fitting room?",
                "example_es": "¿Dónde está el probador?"
            },
            {
                "word": "receipt",
                "translation": "recibo/ticket",
                "explanation": "Paper that proves you paid for something",
                "example": "Can I get a receipt, please?",
                "example_es": "¿Me puede dar un recibo, por favor?"
            }
        ]
    },
    {
        "id": 5,
        "theme": "💼 Work - Office",
        "words": [
            {
                "word": "deadline",
                "translation": "fecha límite",
                "explanation": "The date by which something must be completed",
                "example": "The deadline for this project is Friday.",
                "example_es": "La fecha límite para este proyecto es el viernes."
            },
            {
                "word": "meeting",
                "translation": "reunión/junta",
                "explanation": "When a group gathers to discuss something",
                "example": "We have a meeting at 3 PM.",
                "example_es": "Tenemos una reunión a las 3 PM."
            },
            {
                "word": "colleague",
                "translation": "colega/compañero de trabajo",
                "explanation": "A person you work with",
                "example": "She's my colleague from the marketing team.",
                "example_es": "Ella es mi colega del equipo de marketing."
            }
        ]
    },
    {
        "id": 6,
        "theme": "🏥 Health - Doctor",
        "words": [
            {
                "word": "appointment",
                "translation": "cita",
                "explanation": "A scheduled time to see the doctor",
                "example": "I need to make an appointment with the doctor.",
                "example_es": "Necesito hacer una cita con el doctor."
            },
            {
                "word": "prescription",
                "translation": "receta médica",
                "explanation": "A doctor's note indicating what medicine to take",
                "example": "The doctor gave me a prescription for antibiotics.",
                "example_es": "El doctor me dio una receta para antibióticos."
            },
            {
                "word": "symptoms",
                "translation": "síntomas",
                "explanation": "Signs that indicate you are sick",
                "example": "What symptoms are you experiencing?",
                "example_es": "¿Qué síntomas está experimentando?"
            }
        ]
    },
    {
        "id": 7,
        "theme": "🎓 Education - University",
        "words": [
            {
                "word": "assignment",
                "translation": "tarea/trabajo",
                "explanation": "Work that the teacher asks you to do",
                "example": "I have to finish my assignment by tomorrow.",
                "example_es": "Tengo que terminar mi tarea para mañana."
            },
            {
                "word": "semester",
                "translation": "semestre",
                "explanation": "Half of the school year (6 months)",
                "example": "This is my last semester before graduation.",
                "example_es": "Este es mi último semestre antes de graduarme."
            },
            {
                "word": "tuition",
                "translation": "colegiatura/matrícula",
                "explanation": "The money you pay to study",
                "example": "The tuition for this program is quite expensive.",
                "example_es": "La colegiatura para este programa es bastante cara."
            }
        ]
    }
]


def get_daily_lesson() -> Dict:
    """
    Returns the lesson of the day based on current date
    Rotates automatically each day
    """
    # Get day of year (1-365)
    day_of_year = datetime.now().timetuple().tm_yday
    
    # Select lesson (automatic rotation)
    lesson_index = day_of_year % len(DAILY_LESSONS)
    
    return DAILY_LESSONS[lesson_index]


def get_all_lessons() -> List[Dict]:
    """Returns all available lessons"""
    return DAILY_LESSONS