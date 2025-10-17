from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from src import models
from src import schemas
import bcrypt
from src.text_to_speech import generate_audio_for_sentence  # ✅ CAMBIADO: ahora usa gTTS


def hash_password(password: str) -> str:
    """Hash una contraseña usando bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar una contraseña contra su hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


# ==================== USERS ====================
def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_password = hash_password(user.password)
    db_user = models.User(
        email=user.email,
        password=hashed_password,
        name=user.name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


# ==================== COURSES ====================
def create_course(db: Session, course: schemas.CourseCreate, teacher_id: int) -> models.Course:
    db_course = models.Course(
        title=course.title,
        description=course.description,
        teacher_id=teacher_id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course


def get_course(db: Session, course_id: int) -> Optional[models.Course]:
    return db.query(models.Course).filter(models.Course.id == course_id).first()


def get_courses(db: Session, skip: int = 0, limit: int = 100) -> List[models.Course]:
    return db.query(models.Course).offset(skip).limit(limit).all()


def get_teacher_courses(db: Session, teacher_id: int) -> List[models.Course]:
    return db.query(models.Course).filter(models.Course.teacher_id == teacher_id).all()


def update_course(db: Session, course_id: int, course: schemas.CourseUpdate) -> Optional[models.Course]:
    db_course = get_course(db, course_id)
    if not db_course:
        return None
    
    update_data = course.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_course, key, value)
    
    db_course.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_course)
    return db_course


def delete_course(db: Session, course_id: int) -> bool:
    db_course = get_course(db, course_id)
    if not db_course:
        return False
    db.delete(db_course)
    db.commit()
    return True


# ==================== UNITS ====================
def create_unit(db: Session, unit: schemas.UnitCreate) -> models.Unit:
    db_unit = models.Unit(
        course_id=unit.course_id,
        title=unit.title,
        content=unit.content,
        order=unit.order
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


def get_unit(db: Session, unit_id: int) -> Optional[models.Unit]:
    return db.query(models.Unit).filter(models.Unit.id == unit_id).first()


def get_course_units(db: Session, course_id: int) -> List[models.Unit]:
    return db.query(models.Unit)\
        .filter(models.Unit.course_id == course_id)\
        .order_by(models.Unit.order)\
        .all()


def update_unit(db: Session, unit_id: int, unit: schemas.UnitUpdate) -> Optional[models.Unit]:
    db_unit = get_unit(db, unit_id)
    if not db_unit:
        return None
    
    update_data = unit.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_unit, key, value)
    
    db.commit()
    db.refresh(db_unit)
    return db_unit


def delete_unit(db: Session, unit_id: int) -> bool:
    db_unit = get_unit(db, unit_id)
    if not db_unit:
        return False
    db.delete(db_unit)
    db.commit()
    return True


# ==================== QUIZZES ====================
def create_quiz(db: Session, quiz: schemas.QuizCreate) -> models.Quiz:
    db_quiz = models.Quiz(
        unit_id=quiz.unit_id,
        quiz_type=quiz.quiz_type,
        question=quiz.question,
        correct_answer=quiz.correct_answer,
        options=quiz.options,
        order=quiz.order
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def get_quiz(db: Session, quiz_id: int) -> Optional[models.Quiz]:
    return db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()


def get_unit_quizzes(db: Session, unit_id: int) -> List[models.Quiz]:
    return db.query(models.Quiz)\
        .filter(models.Quiz.unit_id == unit_id)\
        .order_by(models.Quiz.order)\
        .all()


def update_quiz(db: Session, quiz_id: int, quiz: schemas.QuizUpdate) -> Optional[models.Quiz]:
    db_quiz = get_quiz(db, quiz_id)
    if not db_quiz:
        return None
    
    update_data = quiz.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_quiz, key, value)
    
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def delete_quiz(db: Session, quiz_id: int) -> bool:
    db_quiz = get_quiz(db, quiz_id)
    if not db_quiz:
        return False
    db.delete(db_quiz)
    db.commit()
    return True


# ==================== AUDIO SENTENCES ====================
def create_audio_sentence(db: Session, audio: schemas.AudioSentenceCreate) -> models.AudioSentence:
    """
    Crea una oración con audio.
    Genera automáticamente el archivo de audio usando gTTS.
    """
    # Obtener la unidad para saber el curso_id
    unit = get_unit(db, unit_id=audio.unit_id)
    if not unit:
        raise Exception("Unit not found")
    
    # Generar el audio automáticamente
    try:
        audio_path = generate_audio_for_sentence(
            sentence=audio.sentence,
            course_id=unit.course_id,
            unit_order=unit.order,
            lang='en'  # Inglés por defecto
        )
        print(f"✓ Audio generado: {audio_path}")
    except Exception as e:
        print(f"✗ Error al generar audio: {str(e)}")
        # Usar un path por defecto si falla
        audio_path = "/audio/placeholder.mp3"
    
    # Crear el AudioSentence con el path generado
    db_audio = models.AudioSentence(
        unit_id=audio.unit_id,
        sentence=audio.sentence,
        audio_path=audio_path,  # Usar el path generado
        order=audio.order
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)
    return db_audio

def get_audio_sentence(db: Session, audio_id: int) -> Optional[models.AudioSentence]:
    return db.query(models.AudioSentence).filter(models.AudioSentence.id == audio_id).first()


def get_unit_audio_sentences(db: Session, unit_id: int) -> List[models.AudioSentence]:
    return db.query(models.AudioSentence)\
        .filter(models.AudioSentence.unit_id == unit_id)\
        .order_by(models.AudioSentence.order)\
        .all()


def update_audio_sentence(db: Session, audio_id: int, audio: schemas.AudioSentenceUpdate) -> Optional[models.AudioSentence]:
    db_audio = get_audio_sentence(db, audio_id)
    if not db_audio:
        return None
    
    update_data = audio.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_audio, key, value)
    
    db.commit()
    db.refresh(db_audio)
    return db_audio


def delete_audio_sentence(db: Session, audio_id: int) -> bool:
    db_audio = get_audio_sentence(db, audio_id)
    if not db_audio:
        return False
    db.delete(db_audio)
    db.commit()
    return True


# ==================== ENROLLMENTS ====================
def create_enrollment(db: Session, student_id: int, course_id: int) -> models.Enrollment:
    db_enrollment = models.Enrollment(
        student_id=student_id,
        course_id=course_id
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    return db_enrollment


def get_student_enrollments(db: Session, student_id: int) -> List[models.Enrollment]:
    return db.query(models.Enrollment)\
        .filter(models.Enrollment.student_id == student_id)\
        .all()


def get_enrollment(db: Session, student_id: int, course_id: int) -> Optional[models.Enrollment]:
    return db.query(models.Enrollment)\
        .filter(
            models.Enrollment.student_id == student_id,
            models.Enrollment.course_id == course_id
        ).first()


# ==================== CREACIÓN COMPLETA DE CURSO ====================
def create_complete_course(db: Session, course_data: schemas.CourseComplete, teacher_id: int) -> models.Course:
    """
    Crea un curso completo con todas sus unidades, quizzes y audios de una sola vez.
    Mantiene el orden de los elementos según el JSON recibido.
    Genera automáticamente los archivos de audio usando gTTS (Google Text-to-Speech).
    """
    try:
        # 1. Crear el curso
        db_course = models.Course(
            title=course_data.title,
            description=course_data.description,
            teacher_id=teacher_id,
            is_published=course_data.is_published
        )
        db.add(db_course)
        db.flush()  # Obtener el ID sin hacer commit
        
        course_id = db_course.id
        print(f"📚 Curso creado: ID {course_id} - {db_course.title}")
        
        # 2. Procesar cada unidad
        for unit_index, unit_data in enumerate(course_data.unidades):
            print(f"  📖 Procesando unidad {unit_index + 1}: {unit_data.title}")
            
            # Crear la unidad
            db_unit = models.Unit(
                course_id=course_id,
                title=unit_data.title,
                content="",  # Se completará con el texto encontrado
                order=unit_index
            )
            db.add(db_unit)
            db.flush()
            
            # Contadores para el orden de cada tipo de contenido
            audio_order = 0
            quiz_order = 0
            text_content = []
            
            # 3. Procesar cada item de contenido
            for content_item in unit_data.contenido:
                if content_item.tipo == "audio":
                    # Generar audio usando gTTS
                    if content_item.sentence:
                        print(f"    🔊 Generando audio: '{content_item.sentence[:50]}...'")
                        
                        try:
                            # Generar el audio y obtener la ruta
                            # gTTS usa 'en' por defecto para inglés
                            audio_path = generate_audio_for_sentence(
                                sentence=content_item.sentence,
                                course_id=course_id,
                                unit_order=unit_index,
                                lang='en'  # Cambiar a 'es' si es español
                            )
                            
                            # Crear AudioSentence con la ruta generada
                            db_audio = models.AudioSentence(
                                unit_id=db_unit.id,
                                sentence=content_item.sentence,
                                audio_path=audio_path,
                                order=audio_order
                            )
                            db.add(db_audio)
                            audio_order += 1
                            print(f"      ✓ Audio guardado: {audio_path}")
                            
                        except Exception as e:
                            print(f"      ✗ Error al generar audio: {str(e)}")
                            # Continuar con la creación aunque falle un audio
                            # Usar ruta por defecto
                            db_audio = models.AudioSentence(
                                unit_id=db_unit.id,
                                sentence=content_item.sentence,
                                audio_path=f"/audio/placeholder/{audio_order}.mp3",
                                order=audio_order
                            )
                            db.add(db_audio)
                            audio_order += 1
                
                elif content_item.tipo == "texto":
                    # Acumular el texto para el campo content de la unidad
                    if content_item.texto:
                        text_content.append(content_item.texto)
                        print(f"    📝 Texto agregado")
                
                elif content_item.tipo == "quiz":
                    # Crear Quiz
                    if content_item.question and content_item.correct_answer and content_item.quiz_type:
                        db_quiz = models.Quiz(
                            unit_id=db_unit.id,
                            quiz_type=content_item.quiz_type,
                            question=content_item.question,
                            correct_answer=content_item.correct_answer,
                            options=content_item.options,
                            order=quiz_order
                        )
                        db.add(db_quiz)
                        quiz_order += 1
                        print(f"    ❓ Quiz agregado: {content_item.quiz_type}")
            
            # Actualizar el contenido de texto de la unidad
            if text_content:
                db_unit.content = "\n\n".join(text_content)
            
            print(f"    ✓ Unidad completada: {audio_order} audios, {quiz_order} quizzes")
        
        # 4. Commit de todo
        db.commit()
        db.refresh(db_course)
        
        print(f"✅ Curso '{db_course.title}' creado exitosamente con {len(course_data.unidades)} unidades")
        
        return db_course
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error al crear curso: {str(e)}")
        raise e
    


# ==================== FRIENDSHIPS ====================
def send_friend_request(db: Session, requester_id: int, receiver_id: int) -> models.Friendship:
    """Enviar solicitud de amistad"""
    # Verificar que no existe ya una solicitud
    existing = db.query(models.Friendship).filter(
        ((models.Friendship.requester_id == requester_id) & (models.Friendship.receiver_id == receiver_id)) |
        ((models.Friendship.requester_id == receiver_id) & (models.Friendship.receiver_id == requester_id))
    ).first()
    
    if existing:
        raise Exception("Ya existe una solicitud de amistad")
    
    friendship = models.Friendship(
        requester_id=requester_id,
        receiver_id=receiver_id,
        status=models.FriendshipStatus.pending
    )
    db.add(friendship)
    db.commit()
    db.refresh(friendship)
    return friendship


def accept_friend_request(db: Session, friendship_id: int, user_id: int) -> models.Friendship:
    """Aceptar solicitud de amistad"""
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship or friendship.receiver_id != user_id:
        raise Exception("Solicitud no encontrada")
    
    friendship.status = models.FriendshipStatus.accepted
    friendship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(friendship)
    return friendship


def reject_friend_request(db: Session, friendship_id: int, user_id: int) -> models.Friendship:
    """Rechazar solicitud de amistad"""
    friendship = db.query(models.Friendship).filter(models.Friendship.id == friendship_id).first()
    if not friendship or friendship.receiver_id != user_id:
        raise Exception("Solicitud no encontrada")
    
    friendship.status = models.FriendshipStatus.rejected
    friendship.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(friendship)
    return friendship


def get_friend_requests(db: Session, user_id: int) -> List[models.Friendship]:
    """Obtener solicitudes pendientes"""
    return db.query(models.Friendship).filter(
        models.Friendship.receiver_id == user_id,
        models.Friendship.status == models.FriendshipStatus.pending
    ).all()


def get_friends(db: Session, user_id: int) -> List[models.User]:
    """Obtener lista de amigos"""
    friendships = db.query(models.Friendship).filter(
        ((models.Friendship.requester_id == user_id) | (models.Friendship.receiver_id == user_id)),
        models.Friendship.status == models.FriendshipStatus.accepted
    ).all()
    
    friends = []
    for friendship in friendships:
        if friendship.requester_id == user_id:
            friend = get_user_by_id(db, friendship.receiver_id)
        else:
            friend = get_user_by_id(db, friendship.requester_id)
        if friend:
            friends.append(friend)
    
    return friends


def get_all_students(db: Session, exclude_user_id: int = None) -> List[models.User]:
    """Obtener todos los estudiantes (para buscar amigos)"""
    query = db.query(models.User).filter(models.User.role == models.UserRole.student)
    if exclude_user_id:
        query = query.filter(models.User.id != exclude_user_id)
    return query.all()


# ==================== MESSAGES ====================
def send_message(db: Session, sender_id: int, receiver_id: int, content: str) -> models.Message:
    """Enviar mensaje con corrección gramatical"""
    from src.grammar_checker import check_grammar
    
    # Verificar gramática
    grammar_result = check_grammar(content)
    
    message = models.Message(
        sender_id=sender_id,
        receiver_id=receiver_id,
        content=content,
        corrected_content=grammar_result['corrected'] if grammar_result['has_errors'] else None
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_conversation(db: Session, user1_id: int, user2_id: int, limit: int = 50) -> List[models.Message]:
    """Obtener conversación entre dos usuarios"""
    return db.query(models.Message).filter(
        ((models.Message.sender_id == user1_id) & (models.Message.receiver_id == user2_id)) |
        ((models.Message.sender_id == user2_id) & (models.Message.receiver_id == user1_id))
    ).order_by(models.Message.created_at.desc()).limit(limit).all()


def get_conversations(db: Session, user_id: int) -> List[dict]:
    """Obtener lista de conversaciones con preview del último mensaje"""
    from sqlalchemy import or_, and_, func
    
    # Obtener IDs de usuarios con los que se ha conversado
    subquery = db.query(
        models.Message.sender_id,
        models.Message.receiver_id
    ).filter(
        or_(
            models.Message.sender_id == user_id,
            models.Message.receiver_id == user_id
        )
    ).distinct().subquery()
    
    # Obtener último mensaje de cada conversación
    conversations = []
    
    # Usuarios con los que ha chateado
    sender_ids = db.query(models.Message.sender_id).filter(
        models.Message.receiver_id == user_id
    ).distinct().all()
    
    receiver_ids = db.query(models.Message.receiver_id).filter(
        models.Message.sender_id == user_id
    ).distinct().all()
    
    other_user_ids = set([s[0] for s in sender_ids] + [r[0] for r in receiver_ids])
    
    for other_user_id in other_user_ids:
        # Último mensaje
        last_message = db.query(models.Message).filter(
            or_(
                and_(models.Message.sender_id == user_id, models.Message.receiver_id == other_user_id),
                and_(models.Message.sender_id == other_user_id, models.Message.receiver_id == user_id)
            )
        ).order_by(models.Message.created_at.desc()).first()
        
        # Contar no leídos
        unread_count = db.query(models.Message).filter(
            models.Message.sender_id == other_user_id,
            models.Message.receiver_id == user_id,
            models.Message.is_read == False
        ).count()
        
        # Usuario
        other_user = get_user_by_id(db, other_user_id)
        
        if last_message and other_user:
            conversations.append({
                'user': other_user,
                'last_message': last_message,
                'unread_count': unread_count
            })
    
    # Ordenar por fecha del último mensaje
    conversations.sort(key=lambda x: x['last_message'].created_at, reverse=True)
    
    return conversations


def mark_messages_as_read(db: Session, user_id: int, sender_id: int):
    """Marcar mensajes como leídos"""
    db.query(models.Message).filter(
        models.Message.sender_id == sender_id,
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    ).update({models.Message.is_read: True})
    db.commit()