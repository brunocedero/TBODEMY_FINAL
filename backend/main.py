from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import jwt
from jwt import PyJWTError
import os

from src import models
from src import schemas
from src import crud
from src.database import engine, get_db, create_tables

from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Crear las tablas al iniciar
models.Base.metadata.create_all(bind=engine)

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "tu_secret_key_super_segura_cambiala_en_produccion")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

app = FastAPI(title="Tbodemy API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear directorio de archivos estáticos si no existe
STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)
(STATIC_DIR / "audio").mkdir(exist_ok=True)
(STATIC_DIR / "speaking").mkdir(exist_ok=True)

# Montar directorio de archivos estáticos
app.mount("/static/audio", StaticFiles(directory="static/audio"), name="audio")
app.mount("/static/speaking", StaticFiles(directory="static/speaking"), name="speaking_files")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


# ==================== AUTH FUNCTIONS ====================
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except PyJWTError:
        raise credentials_exception
    
    user = crud.get_user_by_id(db, user_id=int(user_id))
    if user is None:
        raise credentials_exception
    return user


def get_current_teacher(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.teacher:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers can access this resource"
        )
    return current_user


def get_current_student(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this resource"
        )
    return current_user


# ==================== AUTH ENDPOINTS ====================
@app.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    return crud.create_user(db=db, user=user)


@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login y obtener token de acceso"""
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }


@app.get("/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user


# ==================== COURSE ENDPOINTS ====================
@app.post("/courses", response_model=schemas.Course, status_code=status.HTTP_201_CREATED)
def create_course(
    course: schemas.CourseCreate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Crear un nuevo curso (solo profesores)"""
    return crud.create_course(db=db, course=course, teacher_id=current_teacher.id)


@app.get("/courses", response_model=List[schemas.Course])
def read_courses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de cursos"""
    courses = crud.get_courses(db, skip=skip, limit=limit)
    return courses


@app.get("/courses/{course_id}", response_model=schemas.CourseWithDetails)
def read_course(course_id: int, db: Session = Depends(get_db)):
    """Obtener detalles de un curso específico"""
    course = crud.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.get("/my-courses", response_model=List[schemas.Course])
def read_my_courses(
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Obtener cursos del profesor actual"""
    return crud.get_teacher_courses(db, teacher_id=current_teacher.id)


@app.put("/courses/{course_id}", response_model=schemas.Course)
def update_course(
    course_id: int,
    course: schemas.CourseUpdate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Actualizar un curso (solo el profesor que lo creó)"""
    db_course = crud.get_course(db, course_id=course_id)
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if db_course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this course")
    
    return crud.update_course(db=db, course_id=course_id, course=course)


@app.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Eliminar un curso (solo el profesor que lo creó)"""
    db_course = crud.get_course(db, course_id=course_id)
    if db_course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if db_course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this course")
    
    crud.delete_course(db=db, course_id=course_id)
    return None


# ==================== UNIT ENDPOINTS ====================
@app.post("/units", response_model=schemas.Unit, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit: schemas.UnitCreate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Crear una nueva unidad (solo profesores)"""
    # Verificar que el curso existe y pertenece al profesor
    course = crud.get_course(db, course_id=unit.course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to add units to this course")
    
    return crud.create_unit(db=db, unit=unit)


@app.get("/courses/{course_id}/units", response_model=List[schemas.UnitWithDetails])
def read_course_units(course_id: int, db: Session = Depends(get_db)):
    """Obtener todas las unidades de un curso"""
    course = crud.get_course(db, course_id=course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return crud.get_course_units(db, course_id=course_id)


@app.get("/units/{unit_id}", response_model=schemas.UnitWithDetails)
def read_unit(unit_id: int, db: Session = Depends(get_db)):
    """Obtener detalles de una unidad específica"""
    unit = crud.get_unit(db, unit_id=unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@app.put("/units/{unit_id}", response_model=schemas.Unit)
def update_unit(
    unit_id: int,
    unit: schemas.UnitUpdate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Actualizar una unidad"""
    db_unit = crud.get_unit(db, unit_id=unit_id)
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Verificar que el profesor es dueño del curso
    course = crud.get_course(db, course_id=db_unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this unit")
    
    return crud.update_unit(db=db, unit_id=unit_id, unit=unit)


@app.delete("/units/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Eliminar una unidad"""
    db_unit = crud.get_unit(db, unit_id=unit_id)
    if db_unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    course = crud.get_course(db, course_id=db_unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this unit")
    
    crud.delete_unit(db=db, unit_id=unit_id)
    return None


# ==================== COURSE COMPLETE ENDPOINT ====================
@app.post("/courses/complete", response_model=schemas.CourseWithDetails, status_code=status.HTTP_201_CREATED)
def create_complete_course(
    course_data: schemas.CourseComplete,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """
    Crear un curso completo con todas sus unidades, quizzes y audios.
    
    Ejemplo de JSON esperado:
    {
        "title": "Curso de Inglés Básico",
        "description": "Aprende inglés desde cero",
        "is_published": false,
        "unidades": [
            {
                "title": "Unidad 1: Saludos",
                "contenido": [
                    {
                        "tipo": "texto",
                        "texto": "En esta unidad aprenderás los saludos básicos en inglés."
                    },
                    {
                        "tipo": "audio",
                        "sentence": "Hello, how are you?",
                        "audio_path": "/audio/hello.mp3"
                    },
                    {
                        "tipo": "quiz",
                        "question": "Hello, [how] are you?",
                        "correct_answer": "how",
                        "quiz_type": "fill_blank"
                    }
                ]
            }
        ]
    }
    """
    try:
        course = crud.create_complete_course(db=db, course_data=course_data, teacher_id=current_teacher.id)
        return course
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating course: {str(e)}"
        )


# ==================== QUIZ ENDPOINTS ====================
@app.post("/quizzes", response_model=schemas.Quiz, status_code=status.HTTP_201_CREATED)
def create_quiz(
    quiz: schemas.QuizCreate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Crear un nuevo quiz"""
    # Verificar que la unidad existe y pertenece a un curso del profesor
    unit = crud.get_unit(db, unit_id=quiz.unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to add quizzes to this unit")
    
    return crud.create_quiz(db=db, quiz=quiz)


@app.get("/units/{unit_id}/quizzes", response_model=List[schemas.Quiz])
def read_unit_quizzes(unit_id: int, db: Session = Depends(get_db)):
    """Obtener todos los quizzes de una unidad"""
    unit = crud.get_unit(db, unit_id=unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    return crud.get_unit_quizzes(db, unit_id=unit_id)


@app.put("/quizzes/{quiz_id}", response_model=schemas.Quiz)
def update_quiz(
    quiz_id: int,
    quiz: schemas.QuizUpdate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Actualizar un quiz"""
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    unit = crud.get_unit(db, unit_id=db_quiz.unit_id)
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quiz")
    
    return crud.update_quiz(db=db, quiz_id=quiz_id, quiz=quiz)


@app.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Eliminar un quiz"""
    db_quiz = crud.get_quiz(db, quiz_id=quiz_id)
    if db_quiz is None:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    unit = crud.get_unit(db, unit_id=db_quiz.unit_id)
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this quiz")
    
    crud.delete_quiz(db=db, quiz_id=quiz_id)
    return None


# ==================== AUDIO SENTENCE ENDPOINTS ====================
@app.post("/audio-sentences", response_model=schemas.AudioSentence, status_code=status.HTTP_201_CREATED)
def create_audio_sentence(
    audio: schemas.AudioSentenceCreate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Crear una nueva oración con audio"""
    unit = crud.get_unit(db, unit_id=audio.unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to add audio to this unit")
    
    return crud.create_audio_sentence(db=db, audio=audio)


@app.get("/units/{unit_id}/audio-sentences", response_model=List[schemas.AudioSentence])
def read_unit_audio_sentences(unit_id: int, db: Session = Depends(get_db)):
    """Obtener todas las oraciones con audio de una unidad"""
    unit = crud.get_unit(db, unit_id=unit_id)
    if unit is None:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    return crud.get_unit_audio_sentences(db, unit_id=unit_id)


@app.put("/audio-sentences/{audio_id}", response_model=schemas.AudioSentence)
def update_audio_sentence(
    audio_id: int,
    audio: schemas.AudioSentenceUpdate,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Actualizar una oración con audio"""
    db_audio = crud.get_audio_sentence(db, audio_id=audio_id)
    if db_audio is None:
        raise HTTPException(status_code=404, detail="Audio sentence not found")
    
    unit = crud.get_unit(db, unit_id=db_audio.unit_id)
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this audio sentence")
    
    return crud.update_audio_sentence(db=db, audio_id=audio_id, audio=audio)


@app.delete("/audio-sentences/{audio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio_sentence(
    audio_id: int,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Eliminar una oración con audio"""
    db_audio = crud.get_audio_sentence(db, audio_id=audio_id)
    if db_audio is None:
        raise HTTPException(status_code=404, detail="Audio sentence not found")
    
    unit = crud.get_unit(db, unit_id=db_audio.unit_id)
    course = crud.get_course(db, course_id=unit.course_id)
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this audio sentence")
    
    crud.delete_audio_sentence(db=db, audio_id=audio_id)
    return None


# ==================== ENROLLMENT ENDPOINTS ====================
@app.post("/enrollments", response_model=schemas.Enrollment, status_code=status.HTTP_201_CREATED)
def enroll_in_course(
    enrollment: schemas.EnrollmentCreate,
    current_student: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Inscribirse en un curso (solo estudiantes)"""
    # Verificar que el curso existe y está publicado
    course = crud.get_course(db, course_id=enrollment.course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    if not course.is_published:
        raise HTTPException(status_code=400, detail="Course is not published yet")
    
    # Verificar que no está ya inscrito
    existing_enrollment = crud.get_enrollment(db, student_id=current_student.id, course_id=enrollment.course_id)
    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")
    
    return crud.create_enrollment(db=db, student_id=current_student.id, course_id=enrollment.course_id)


@app.get("/my-enrollments", response_model=List[schemas.Enrollment])
def read_my_enrollments(
    current_student: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener mis inscripciones (solo estudiantes)"""
    return crud.get_student_enrollments(db, student_id=current_student.id)



# ==================== SOCIAL ENDPOINTS ====================

# ==================== FRIENDSHIP ENDPOINTS ====================
@app.get("/students", response_model=List[schemas.User])
def get_all_students(
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener lista de todos los estudiantes (para buscar amigos)"""
    return crud.get_all_students(db, exclude_user_id=current_user.id)


@app.post("/friend-requests", response_model=schemas.FriendshipResponse)
def send_friend_request(
    receiver_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Enviar solicitud de amistad"""
    try:
        return crud.send_friend_request(db, current_user.id, receiver_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/friend-requests", response_model=List[schemas.FriendshipResponse])
def get_friend_requests(
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener solicitudes de amistad pendientes"""
    return crud.get_friend_requests(db, current_user.id)


@app.post("/friend-requests/{friendship_id}/accept")
def accept_friend_request(
    friendship_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Aceptar solicitud de amistad"""
    try:
        return crud.accept_friend_request(db, friendship_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/friend-requests/{friendship_id}/reject")
def reject_friend_request(
    friendship_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Rechazar solicitud de amistad"""
    try:
        return crud.reject_friend_request(db, friendship_id, current_user.id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/friends", response_model=List[schemas.User])
def get_friends(
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener lista de amigos"""
    return crud.get_friends(db, current_user.id)


# ==================== MESSAGE ENDPOINTS ====================
@app.post("/messages", response_model=schemas.MessageResponse)
def send_message(
    message: schemas.MessageCreate,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Enviar mensaje (con corrección gramatical automática)"""
    return crud.send_message(db, current_user.id, message.receiver_id, message.content)


@app.get("/conversations", response_model=List[schemas.ConversationPreview])
def get_conversations(
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener lista de conversaciones"""
    return crud.get_conversations(db, current_user.id)


@app.get("/conversations/{other_user_id}", response_model=List[schemas.MessageResponse])
def get_conversation(
    other_user_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener conversación con un usuario específico"""
    # Marcar como leídos
    crud.mark_messages_as_read(db, current_user.id, other_user_id)
    
    messages = crud.get_conversation(db, current_user.id, other_user_id)
    return list(reversed(messages))  # Ordenar cronológicamente


@app.post("/grammar-check")
def check_grammar_endpoint(
    text: str,
    current_user: models.User = Depends(get_current_student)
):
    """Verificar gramática de un texto"""
    from src.grammar_checker import check_grammar, get_corrections_summary
    
    result = check_grammar(text)
    return {
        'original': result['original'],
        'corrected': result['corrected'],
        'has_errors': result['has_errors'],
        'corrections': get_corrections_summary(result['matches'])
    }


@app.get("/courses/{course_id}/students", response_model=List[schemas.User])
def get_course_students(
    course_id: int,
    current_teacher: models.User = Depends(get_current_teacher),
    db: Session = Depends(get_db)
):
    """Obtener estudiantes inscritos en un curso (solo profesores del curso)"""
    # Verificar que el curso existe y pertenece al profesor
    course = crud.get_course(db, course_id=course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course.teacher_id != current_teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized to view students of this course")
    
    # Obtener enrollments del curso
    enrollments_list = db.query(models.Enrollment).filter(
        models.Enrollment.course_id == course_id
    ).all()
    
    # Obtener los estudiantes
    students = []
    for enrollment in enrollments_list:
        student = crud.get_user_by_id(db, enrollment.student_id)
        if student:
            students.append(student)
    
    return students


# ==================== ROOT ====================
@app.get("/")
def root():
    return {
        "message": "Welcome to Tbodemy API",
        "version": "1.0.0",
        "docs": "/docs"
    }


# ==================== SPEAKING PRACTICE ENDPOINTS ====================
from fastapi import UploadFile, File
import shutil
from pathlib import Path

# Directorio temporal para audios subidos
TEMP_AUDIO_DIR = Path("temp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)


@app.post("/speaking/sessions", response_model=schemas.SpeakingSessionResponse)
def create_speaking_session_endpoint(
    session_data: schemas.SpeakingSessionCreate,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Crear nueva sesión de speaking con IA"""
    try:
        session = crud.create_speaking_session(
            db=db,
            student_id=current_user.id,
            topic=session_data.topic,
            conversation_type=session_data.conversation_type.value,
            difficulty_level=session_data.difficulty_level.value
        )
        return session
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/speaking/sessions", response_model=List[schemas.SpeakingSessionResponse])
def get_my_speaking_sessions(
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener sesiones de speaking del estudiante"""
    return crud.get_student_speaking_sessions(db, current_user.id)


@app.get("/speaking/sessions/{session_id}", response_model=schemas.SpeakingSessionWithMessages)
def get_speaking_session_detail(
    session_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Obtener detalles de una sesión con mensajes"""
    session = crud.get_speaking_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return session


from src.openai_service import STTQuotaExceededError  # importa la excepción
import shutil

@app.post("/speaking/sessions/{session_id}/message")
async def send_speaking_message(
    session_id: int,
    audio: UploadFile = File(...),
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """
    Enviar mensaje de voz y recibir respuesta del asistente.
    Ahora devuelve AMBOS mensajes (user y assistant) con corrección gramatical
    """
    # 1) Verificar sesión y permisos
    session = crud.get_speaking_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")

    # 2) Guardar audio temporalmente
    temp_file_path = TEMP_AUDIO_DIR / f"temp_{session_id}_{audio.filename}"

    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # 3) Procesar mensaje (transcribe -> corrige -> genera respuesta -> TTS)
        result = crud.add_speaking_message(db, session_id, str(temp_file_path))
        
        # 4) Convertir a schemas para respuesta
        user_message = schemas.SpeakingMessageResponse.from_orm(result["user_message"])
        assistant_message = schemas.SpeakingMessageResponse.from_orm(result["assistant_message"])
        
        # 5) Devolver ambos mensajes
        return {
            "user_message": user_message,
            "assistant_message": assistant_message
        }

    except STTQuotaExceededError:
        raise HTTPException(
            status_code=429, 
            detail="STT quota exceeded. Please check your OpenAI billing."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing audio: {str(e)}"
        )
    finally:
        # 6) Limpiar archivo temporal
        try:
            if temp_file_path.exists():
                temp_file_path.unlink()
        except Exception:
            pass


@app.post("/speaking/sessions/{session_id}/end")
def end_speaking_session_endpoint(
    session_id: int,
    current_user: models.User = Depends(get_current_student),
    db: Session = Depends(get_db)
):
    """Finalizar sesión de speaking"""
    session = crud.get_speaking_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.end_speaking_session(db, session_id)
    return {"message": "Session ended successfully"}

# ==================== DAILY LESSONS ====================


from src.daily_vocabulary import get_daily_lesson, get_all_lessons
from src.text_to_speech import generate_audio_for_sentence

@app.get("/daily-lesson")
def get_daily_lesson_endpoint():
    """Obtener la lección del día con vocabulario"""
    from src.daily_vocabulary import get_daily_lesson
    from pathlib import Path
    from gtts import gTTS
    
    lesson = get_daily_lesson()
    
    # Directorio de audios
    audio_base_dir = Path(__file__).parent.parent / "static" / "audio" / "daily_lessons"
    audio_base_dir.mkdir(parents=True, exist_ok=True)
    
    for word_data in lesson["words"]:
        # Nombre del archivo
        safe_word = word_data['word'].replace(' ', '_').replace('/', '_')
        filename = f"daily_{safe_word}.mp3"
        filepath = audio_base_dir / filename
        
        # Generar si no existe
        if not filepath.exists():
            try:
                tts = gTTS(text=word_data['example'], lang='en', slow=False)
                tts.save(str(filepath))
                print(f"✅ Generado: {filename}")
            except Exception as e:
                print(f"❌ Error: {e}")
                word_data['audio_path'] = None
                continue
        
        # Asignar ruta con /static
        word_data['audio_path'] = f"/static/audio/daily_lessons/{filename}"
    
    return lesson


@app.get("/daily-lesson/all")
def get_all_lessons_endpoint():
    """Obtener todas las lecciones (para admin o estadísticas)"""
    return get_all_lessons()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)