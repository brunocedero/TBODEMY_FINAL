from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum

Base = declarative_base()


class UserRole(str, enum.Enum):
    student = "student"
    teacher = "teacher"


class QuizType(str, enum.Enum):
    fill_blank = "fill_blank"
    multiple_choice = "multiple_choice"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name='user_role'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    courses_created = relationship("Course", back_populates="teacher", foreign_keys="Course.teacher_id")
    enrollments = relationship("Enrollment", back_populates="student")


class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    teacher = relationship("User", back_populates="courses_created", foreign_keys=[teacher_id])
    units = relationship("Unit", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")


class Unit(Base):
    __tablename__ = "units"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False)  # Orden dentro del curso
    content = Column(Text)  # Texto de la unidad
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    course = relationship("Course", back_populates="units")
    quizzes = relationship("Quiz", back_populates="unit", cascade="all, delete-orphan")
    audio_sentences = relationship("AudioSentence", back_populates="unit", cascade="all, delete-orphan")


class Quiz(Base):
    __tablename__ = "quizzes"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    quiz_type = Column(Enum(QuizType, name='quiz_type'), nullable=False)
    question = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    options = Column(JSON)  # Para multiple choice, guardar array de opciones
    order = Column(Integer, nullable=False)  # Orden dentro de la unidad
    
    # Relaciones
    unit = relationship("Unit", back_populates="quizzes")


class AudioSentence(Base):
    __tablename__ = "audio_sentences"
    
    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    sentence = Column(Text, nullable=False)  # La oración en texto
    audio_path = Column(String(500), nullable=False)  # Ruta al archivo de audio
    order = Column(Integer, nullable=False)  # Orden dentro de la unidad
    
    # Relaciones
    unit = relationship("Unit", back_populates="audio_sentences")


class Enrollment(Base):
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    progress = Column(JSON, default={})  # Guardar progreso del estudiante
    
    # Relaciones
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")


# ==================== SOCIAL FEATURES ====================

class FriendshipStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Friendship(Base):
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(Enum(FriendshipStatus, name='friendship_status'), default=FriendshipStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    requester = relationship("User", foreign_keys=[requester_id], backref="sent_requests")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_requests")


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    corrected_content = Column(Text)  # Versión corregida
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")