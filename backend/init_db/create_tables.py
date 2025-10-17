"""
Script para crear todas las tablas en la base de datos PostgreSQL
"""
import sys
from sqlalchemy import inspect, text

# Colores para consola
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

def print_header(message):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}")
    print(f"  {message}")
    print(f"{'='*60}{Colors.END}\n")


def check_env_file():
    """Verificar que existe el archivo .env"""
    import os
    if not os.path.exists('.env'):
        print_error("No se encontró el archivo .env")
        print_info("Crea un archivo .env con:")
        print("  DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/tbodemy")
        print("  SECRET_KEY=tu_secret_key_aqui")
        print("\nO ejecuta: python setup_db.py")
        return False
    return True


def test_connection():
    """Probar la conexión a la base de datos"""
    print_info("Probando conexión a la base de datos...")
    
    try:
        from database import engine
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print_success("Conexión exitosa!")
            print_info(f"PostgreSQL: {version.split(',')[0]}")
            return True
            
    except Exception as e:
        print_error(f"Error al conectar: {str(e)}")
        print_info("\nVerifica que:")
        print("  1. PostgreSQL está corriendo")
        print("  2. Las credenciales en .env son correctas")
        print("  3. La base de datos existe")
        return False


def list_existing_tables():
    """Listar tablas existentes"""
    try:
        from database import engine
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        if tables:
            print_warning(f"Se encontraron {len(tables)} tabla(s) existente(s):")
            for table in tables:
                print(f"  - {table}")
            return tables
        else:
            print_info("No hay tablas en la base de datos")
            return []
            
    except Exception as e:
        print_error(f"Error al listar tablas: {str(e)}")
        return []


def drop_all_tables():
    """Eliminar todas las tablas (con confirmación)"""
    print_warning("\n⚠️  ADVERTENCIA: Esto eliminará TODAS las tablas y datos ⚠️")
    confirmation = input("¿Estás seguro? Escribe 'SI' para confirmar: ")
    
    if confirmation != 'SI':
        print_info("Operación cancelada")
        return False
    
    try:
        from database import engine
        from models import Base
        
        print_info("Eliminando todas las tablas...")
        Base.metadata.drop_all(bind=engine)
        print_success("Tablas eliminadas exitosamente")
        return True
        
    except Exception as e:
        print_error(f"Error al eliminar tablas: {str(e)}")
        return False


def create_all_tables():
    """Crear todas las tablas"""
    print_info("Creando tablas...")
    
    try:
        from database import engine
        from models import Base
        
        # Crear todas las tablas definidas en los modelos
        Base.metadata.create_all(bind=engine)
        
        # Verificar tablas creadas
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print_success(f"{len(tables)} tablas creadas exitosamente:")
        for table in sorted(tables):
            print(f"  ✓ {table}")
            
            # Mostrar columnas de cada tabla
            columns = inspector.get_columns(table)
            print(f"    Columnas: {', '.join([col['name'] for col in columns[:5]])}", end='')
            if len(columns) > 5:
                print(f"... (+{len(columns)-5} más)")
            else:
                print()
        
        return True
        
    except Exception as e:
        print_error(f"Error al crear tablas: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def show_table_details():
    """Mostrar detalles de las tablas creadas"""
    print_info("\nDetalles de las tablas:")
    
    try:
        from database import engine
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        for table in sorted(tables):
            print(f"\n{Colors.CYAN}{Colors.BOLD}Tabla: {table}{Colors.END}")
            
            # Columnas
            columns = inspector.get_columns(table)
            print("  Columnas:")
            for col in columns:
                nullable = "NULL" if col['nullable'] else "NOT NULL"
                col_type = str(col['type'])
                print(f"    - {col['name']:<20} {col_type:<20} {nullable}")
            
            # Foreign keys
            fks = inspector.get_foreign_keys(table)
            if fks:
                print("  Foreign Keys:")
                for fk in fks:
                    print(f"    - {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
        
        return True
        
    except Exception as e:
        print_error(f"Error al mostrar detalles: {str(e)}")
        return False


def main():
    print_header("TBODEMY - Creación de Tablas PostgreSQL")
    
    # 1. Verificar archivo .env
    if not check_env_file():
        sys.exit(1)
    
    # 2. Probar conexión
    print_header("Paso 1: Verificar Conexión")
    if not test_connection():
        sys.exit(1)
    
    # 3. Listar tablas existentes
    print_header("Paso 2: Verificar Tablas Existentes")
    existing_tables = list_existing_tables()
    
    # 4. Preguntar si eliminar tablas existentes
    if existing_tables:
        print("\n¿Qué deseas hacer?")
        print("  1. Crear solo las tablas que faltan (recomendado)")
        print("  2. Eliminar todas y crear de nuevo (⚠️  perderás todos los datos)")
        print("  3. Cancelar")
        
        choice = input("\nElige una opción (1/2/3): ").strip()
        
        if choice == "2":
            print_header("Paso 3: Eliminar Tablas Existentes")
            if not drop_all_tables():
                sys.exit(1)
        elif choice == "3":
            print_info("Operación cancelada")
            sys.exit(0)
    
    # 5. Crear tablas
    print_header("Paso 3: Crear Tablas" if not existing_tables else "Paso 4: Crear Tablas")
    if not create_all_tables():
        sys.exit(1)
    
    # 6. Mostrar detalles (opcional)
    show_details = input("\n¿Mostrar detalles de las tablas? (s/n): ").lower()
    if show_details == 's':
        show_table_details()
    
    # 7. Resumen final
    print_header("¡Tablas Creadas Exitosamente! 🎉")
    print_success("La base de datos está lista para usar\n")
    print_info("Próximos pasos:")
    print("  1. Iniciar el servidor: python main.py")
    print("  2. Probar la API: python test_api.py")
    print("  3. Ver documentación: http://localhost:8000/docs\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\nOperación cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print_error(f"\n\nError inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)