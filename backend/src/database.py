from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# URL de conexión a PostgreSQL
# Formato: postgresql://usuario:contraseña@host:puerto/nombre_db
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/tbodemy"
)

# Crear engine de SQLAlchemy
engine = create_engine(
    DATABASE_URL,
    echo=True,  # Cambiar a False en producción
    pool_pre_ping=True,  # Verificar conexiones antes de usarlas
    pool_size=10,  # Número de conexiones en el pool
    max_overflow=20  # Conexiones adicionales permitidas
)

# Crear SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()


# Dependency para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Función para crear todas las tablas
def create_tables():
    from models import Base  # Importar Base desde models
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente")


# Función para eliminar todas las tablas (usar con cuidado)
def drop_tables():
    from models import Base
    Base.metadata.drop_all(bind=engine)
    print("⚠️ Tablas eliminadas")