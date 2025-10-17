#!/usr/bin/env python3
"""
Script para arreglar las dependencias de bcrypt/passlib
Compatible con Windows, Linux y macOS
"""
import subprocess
import sys
import os

# Colores para consola
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
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
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*60}")
    print(f"  {message}")
    print(f"{'='*60}{Colors.END}\n")


def run_command(cmd, description):
    """Ejecutar un comando y mostrar resultado"""
    print_info(description)
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print_error(f"Error: {e.stderr}")
        return False


def check_venv():
    """Verificar que estamos en un entorno virtual"""
    if not os.environ.get('VIRTUAL_ENV'):
        print_error("No estás en un entorno virtual")
        print_info("Por favor activa tu entorno virtual primero:")
        print("  Linux/Mac: source venv/bin/activate")
        print("  Windows: venv\\Scripts\\activate")
        return False
    
    print_success(f"Entorno virtual detectado: {os.environ['VIRTUAL_ENV']}")
    return True


def main():
    print_header("Arreglando Dependencias de Tbodemy")
    
    # 1. Verificar entorno virtual
    if not check_venv():
        sys.exit(1)
    
    # 2. Desinstalar versiones problemáticas
    print_header("Paso 1: Desinstalar versiones problemáticas")
    if not run_command(
        "pip uninstall -y passlib bcrypt",
        "Desinstalando passlib y bcrypt..."
    ):
        print_warning("Algunas librerías no estaban instaladas, continuando...")
    
    # 3. Instalar bcrypt compatible
    print_header("Paso 2: Instalar bcrypt compatible")
    if not run_command(
        "pip install bcrypt==4.0.1",
        "Instalando bcrypt 4.0.1..."
    ):
        print_error("Error al instalar bcrypt")
        sys.exit(1)
    
    # 4. Verificar bcrypt
    print_header("Paso 3: Verificar bcrypt")
    try:
        import bcrypt
        print_success(f"bcrypt version: {bcrypt.__version__}")
    except ImportError:
        print_error("bcrypt no se instaló correctamente")
        sys.exit(1)
    
    # 5. Reinstalar todas las dependencias
    print_header("Paso 4: Reinstalar todas las dependencias")
    if not run_command(
        "pip install -r requirements.txt",
        "Instalando todas las dependencias..."
    ):
        print_error("Error al instalar dependencias")
        sys.exit(1)
    
    # 6. Verificación final
    print_header("Paso 5: Verificación final")
    try:
        import bcrypt
        import fastapi
        import sqlalchemy
        print_success("✓ bcrypt")
        print_success("✓ fastapi")
        print_success("✓ sqlalchemy")
        print_success("Todas las dependencias están correctas")
    except ImportError as e:
        print_error(f"Error en la verificación: {e}")
        sys.exit(1)
    
    # 7. Resumen
    print_header("¡Dependencias Arregladas! 🎉")
    print_success("El problema de bcrypt/passlib ha sido resuelto\n")
    print_info("Ahora puedes ejecutar:")
    print("  python main.py")
    print("  python test_api.py\n")


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