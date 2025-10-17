"""
Script para configurar automáticamente la base de datos PostgreSQL
"""
import os
import sys
import subprocess
import secrets
from pathlib import Path

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


def check_postgresql():
    """Verificar si PostgreSQL está instalado"""
    print_info("Verificando instalación de PostgreSQL...")
    
    try:
        result = subprocess.run(
            ['psql', '--version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print_success(f"PostgreSQL encontrado: {version}")
            return True
        else:
            print_error("PostgreSQL no está instalado o no está en el PATH")
            return False
    except FileNotFoundError:
        print_error("PostgreSQL no está instalado o no está en el PATH")
        return False


def get_db_credentials():
    """Solicitar credenciales de la base de datos"""
    print_info("Configuración de credenciales de la base de datos\n")
    
    db_user = input(f"Usuario de PostgreSQL [{Colors.CYAN}postgres{Colors.END}]: ").strip() or "postgres"
    db_password = input(f"Contraseña de PostgreSQL: ").strip()
    
    if not db_password:
        print_warning("No se proporcionó contraseña. Intentando sin contraseña...")
        db_password = ""
    
    db_host = input(f"Host [{Colors.CYAN}localhost{Colors.END}]: ").strip() or "localhost"
    db_port = input(f"Puerto [{Colors.CYAN}5432{Colors.END}]: ").strip() or "5432"
    db_name = input(f"Nombre de la base de datos [{Colors.CYAN}tbodemy{Colors.END}]: ").strip() or "tbodemy"
    
    return {
        'user': db_user,
        'password': db_password,
        'host': db_host,
        'port': db_port,
        'name': db_name
    }


def create_database(credentials):
    """Crear la base de datos en PostgreSQL"""
    print_info(f"Creando base de datos '{credentials['name']}'...")
    
    # Comando para crear la base de datos
    cmd = [
        'psql',
        '-U', credentials['user'],
        '-h', credentials['host'],
        '-p', credentials['port'],
        '-c', f"CREATE DATABASE {credentials['name']};"
    ]
    
    try:
        # Si hay contraseña, configurar variable de entorno
        env = os.environ.copy()
        if credentials['password']:
            env['PGPASSWORD'] = credentials['password']
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            env=env
        )
        
        if result.returncode == 0 or 'already exists' in result.stderr:
            if 'already exists' in result.stderr:
                print_warning(f"La base de datos '{credentials['name']}' ya existe")
            else:
                print_success(f"Base de datos '{credentials['name']}' creada exitosamente")
            return True
        else:
            print_error(f"Error al crear la base de datos: {result.stderr}")
            return False
            
    except Exception as e:
        print_error(f"Error al crear la base de datos: {str(e)}")
        return False


def create_env_file(credentials):
    """Crear archivo .env con las configuraciones"""
    print_info("Creando archivo .env...")
    
    # Generar SECRET_KEY segura
    secret_key = secrets.token_urlsafe(32)
    
    # Construir DATABASE_URL
    if credentials['password']:
        database_url = f"postgresql://{credentials['user']}:{credentials['password']}@{credentials['host']}:{credentials['port']}/{credentials['name']}"
    else:
        database_url = f"postgresql://{credentials['user']}@{credentials['host']}:{credentials['port']}/{credentials['name']}"
    
    env_content = f"""# Database Configuration
DATABASE_URL={database_url}

# JWT Configuration
SECRET_KEY={secret_key}
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print_success("Archivo .env creado exitosamente")
        return True
    except Exception as e:
        print_error(f"Error al crear archivo .env: {str(e)}")
        return False


def create_tables():
    """Crear las tablas en la base de datos"""
    print_info("Creando tablas en la base de datos...")
    
    try:
        # Importar después de crear .env
        from database import create_tables as db_create_tables
        db_create_tables()
        print_success("Tablas creadas exitosamente")
        return True
    except Exception as e:
        print_error(f"Error al crear tablas: {str(e)}")
        print_warning("Intenta ejecutar: python create_tables.py")
        return False


def verify_installation():
    """Verificar que todo esté configurado correctamente"""
    print_info("Verificando instalación...")
    
    try:
        from database import engine
        from sqlalchemy import text
        
        with engine.connect() as connection:
            result = connection.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print_success(f"Conexión exitosa a PostgreSQL")
            print_info(f"Versión: {version.split(',')[0]}")
            
            # Contar tablas
            result = connection.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
            ))
            table_count = result.fetchone()[0]
            print_success(f"Tablas creadas: {table_count}")
            
            return True
    except Exception as e:
        print_error(f"Error en la verificación: {str(e)}")
        return False


def main():
    print_header("TBODEMY - Configuración de Base de Datos PostgreSQL")
    
    # 1. Verificar PostgreSQL
    if not check_postgresql():
        print_error("\nPor favor instala PostgreSQL antes de continuar:")
        print_info("  Windows: https://www.postgresql.org/download/windows/")
        print_info("  macOS: brew install postgresql@15")
        print_info("  Linux: sudo apt install postgresql postgresql-contrib")
        sys.exit(1)
    
    # 2. Obtener credenciales
    print_header("Paso 1: Credenciales de PostgreSQL")
    credentials = get_db_credentials()
    
    # 3. Crear base de datos
    print_header("Paso 2: Crear Base de Datos")
    if not create_database(credentials):
        print_error("\nNo se pudo crear la base de datos automáticamente.")
        print_info("Puedes crearla manualmente con:")
        print(f"  psql -U {credentials['user']} -c \"CREATE DATABASE {credentials['name']};\"")
        
        response = input("\n¿Deseas continuar de todas formas? (s/n): ")
        if response.lower() != 's':
            sys.exit(1)
    
    # 4. Crear archivo .env
    print_header("Paso 3: Configurar Variables de Entorno")
    if not create_env_file(credentials):
        sys.exit(1)
    
    # 5. Crear tablas
    print_header("Paso 4: Crear Tablas")
    if not create_tables():
        print_warning("\nLas tablas no se pudieron crear automáticamente.")
        print_info("Puedes crearlas manualmente ejecutando:")
        print("  python create_tables.py")
    
    # 6. Verificar instalación
    print_header("Paso 5: Verificar Instalación")
    if verify_installation():
        print_header("¡Configuración Completada Exitosamente! 🎉")
        print_success("La base de datos está lista para usar\n")
        print_info("Próximos pasos:")
        print("  1. Iniciar el servidor: python main.py")
        print("  2. Probar la API: python test_api.py")
        print("  3. Ver documentación: http://localhost:8000/docs\n")
    else:
        print_header("Configuración Completada con Advertencias ⚠️")
        print_warning("Hay algunos problemas, pero puedes continuar")
        print_info("Revisa los errores arriba y corrígelos antes de continuar\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\n\nConfiguración cancelada por el usuario")
        sys.exit(0)
    except Exception as e:
        print_error(f"\n\nError inesperado: {str(e)}")
        sys.exit(1)