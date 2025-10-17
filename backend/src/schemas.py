from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"


class QuizType(str, Enum):
    fill_blank = "fill_blank"
    multiple_choice = "multiple_choice"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Course Schemas
class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_published: Optional[bool] = None


class Course(CourseBase):
    id: int
    teacher_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Unit Schemas
class UnitBase(BaseModel):
    title: str
    content: Optional[str] = None
    order: int = Field(ge=0)


class UnitCreate(UnitBase):
    course_id: int


class UnitUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)


class Unit(UnitBase):
    id: int
    course_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Quiz Schemas
class QuizBase(BaseModel):
    quiz_type: QuizType
    question: str
    correct_answer: str
    options: Optional[List[str]] = None  # Solo para multiple choice
    order: int = Field(ge=0)


class QuizCreate(QuizBase):
    unit_id: int


class QuizUpdate(BaseModel):
    quiz_type: Optional[QuizType] = None
    question: Optional[str] = None
    correct_answer: Optional[str] = None
    options: Optional[List[str]] = None
    order: Optional[int] = Field(None, ge=0)


class Quiz(QuizBase):
    id: int
    unit_id: int
    
    class Config:
        from_attributes = True


# AudioSentence Schemas
class AudioSentenceBase(BaseModel):
    sentence: str
    audio_path: str
    order: int = Field(ge=0)


class AudioSentenceCreate(BaseModel):
    unit_id: int
    sentence: str
    audio_path: str = ""  # Opcional, el backend lo generará
    order: int = Field(ge=0)


class AudioSentenceUpdate(BaseModel):
    sentence: Optional[str] = None
    audio_path: Optional[str] = None
    order: Optional[int] = Field(None, ge=0)


class AudioSentence(AudioSentenceBase):
    id: int
    unit_id: int
    
    class Config:
        from_attributes = True


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    course_id: int


class Enrollment(BaseModel):
    id: int
    student_id: int
    course_id: int
    enrolled_at: datetime
    progress: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True


# Schemas completos con relaciones
class UnitWithDetails(Unit):
    quizzes: List[Quiz] = []
    audio_sentences: List[AudioSentence] = []


class CourseWithUnits(Course):
    units: List[Unit] = []


class CourseWithDetails(Course):
    teacher: User
    units: List[UnitWithDetails] = []


# ==================== SCHEMAS PARA CREACIÓN COMPLETA ====================
class ContentItem(BaseModel):
    """Item individual de contenido (puede ser audio, texto o quiz)"""
    tipo: str  # "audio", "texto", "quiz"
    
    # Campos para audio
    sentence: Optional[str] = None
    audio_path: Optional[str] = None
    
    # Campos para texto
    texto: Optional[str] = None
    
    # Campos para quiz
    question: Optional[str] = None
    correct_answer: Optional[str] = None
    quiz_type: Optional[QuizType] = None
    options: Optional[List[str]] = None  # Solo para multiple choice


class UnitContent(BaseModel):
    """Unidad con su contenido ordenado"""
    title: str
    contenido: List[ContentItem]


class CourseComplete(BaseModel):
    """Curso completo con todas sus unidades y contenido"""
    title: str
    description: Optional[str] = None
    is_published: bool = False
    unidades: List[UnitContent]



# ==================== SOCIAL FEATURES ====================

class FriendshipStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


# Friendship Schemas
class FriendshipCreate(BaseModel):
    receiver_id: int


class FriendshipResponse(BaseModel):
    id: int
    requester_id: int
    receiver_id: int
    status: FriendshipStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class FriendshipWithUser(BaseModel):
    id: int
    status: FriendshipStatus
    created_at: datetime
    user: User  # El otro usuario (amigo o solicitante)
    
    class Config:
        from_attributes = True


# Message Schemas
class MessageCreate(BaseModel):
    receiver_id: int
    content: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    corrected_content: Optional[str] = None
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class MessageWithUser(MessageResponse):
    sender: User
    receiver: User
    
    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    user: User  # El otro usuario en la conversación
    last_message: MessageResponse
    unread_count: int