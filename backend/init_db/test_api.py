import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"

# Colores para consola
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")


# 1. Registrar un profesor
def register_teacher():
    print_info("Registrando profesor...")
    
    teacher_data = {
        "email": "teacher@tbodemy.com",
        "password": "teacher123",
        "name": "Professor Smith",
        "role": "teacher"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=teacher_data)
    
    if response.status_code == 201:
        print_success("Profesor registrado exitosamente")
        return response.json()
    elif response.status_code == 400:
        print_warning("Profesor ya existe, continuando...")
        return None
    else:
        print_error(f"Error al registrar profesor: {response.text}")
        return None


# 2. Login del profesor
def login_teacher():
    print_info("Iniciando sesión como profesor...")
    
    login_data = {
        "username": "teacher@tbodemy.com",
        "password": "teacher123"
    }
    
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print_success(f"Login exitoso. Token obtenido.")
        return data["access_token"]
    else:
        print_error(f"Error en login: {response.text}")
        return None


# 3. Crear curso completo
def create_complete_course(token):
    print_info("Creando curso completo...")
    
    # Leer el JSON de ejemplo
    with open('example_course.json', 'r', encoding='utf-8') as f:
        course_data = json.load(f)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        f"{BASE_URL}/courses/complete",
        json=course_data,
        headers=headers
    )
    
    if response.status_code == 201:
        course = response.json()
        print_success(f"Curso creado exitosamente!")
        print_info(f"  ID: {course['id']}")
        print_info(f"  Título: {course['title']}")
        print_info(f"  Unidades: {len(course.get('units', []))}")
        return course
    else:
        print_error(f"Error al crear curso: {response.text}")
        return None


# 4. Obtener detalles del curso
def get_course_details(course_id):
    print_info(f"Obteniendo detalles del curso {course_id}...")
    
    response = requests.get(f"{BASE_URL}/courses/{course_id}")
    
    if response.status_code == 200:
        course = response.json()
        print_success("Detalles del curso obtenidos")
        
        print("\n" + "="*50)
        print(f"Curso: {course['title']}")
        print(f"Descripción: {course.get('description', 'N/A')}")
        print(f"Profesor ID: {course['teacher_id']}")
        print(f"Publicado: {'Sí' if course['is_published'] else 'No'}")
        print("="*50)
        
        # Mostrar unidades
        units = course.get('units', [])
        print(f"\nUnidades ({len(units)}):")
        
        for i, unit in enumerate(units, 1):
            print(f"\n  {i}. {unit['title']}")
            
            # Contar contenido
            quizzes = unit.get('quizzes', [])
            audios = unit.get('audio_sentences', [])
            
            print(f"     - Quizzes: {len(quizzes)}")
            print(f"     - Audios: {len(audios)}")
            
            # Mostrar algunos quizzes
            if quizzes:
                print(f"     Quizzes:")
                for quiz in quizzes[:2]:  # Mostrar solo los primeros 2
                    print(f"       • {quiz['question']} ({quiz['quiz_type']})")
            
            # Mostrar algunos audios
            if audios:
                print(f"     Audios:")
                for audio in audios[:2]:  # Mostrar solo los primeros 2
                    print(f"       • {audio['sentence']}")
        
        return course
    else:
        print_error(f"Error al obtener detalles: {response.text}")
        return None


# 5. Registrar un estudiante
def register_student():
    print_info("Registrando estudiante...")
    
    student_data = {
        "email": "student@tbodemy.com",
        "password": "student123",
        "name": "John Student",
        "role": "student"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=student_data)
    
    if response.status_code == 201:
        print_success("Estudiante registrado exitosamente")
        return response.json()
    elif response.status_code == 400:
        print_warning("Estudiante ya existe, continuando...")
        return None
    else:
        print_error(f"Error al registrar estudiante: {response.text}")
        return None


# 6. Publicar curso (para que los estudiantes puedan inscribirse)
def publish_course(course_id, token):
    print_info(f"Publicando curso {course_id}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    update_data = {
        "is_published": True
    }
    
    response = requests.put(
        f"{BASE_URL}/courses/{course_id}",
        json=update_data,
        headers=headers
    )
    
    if response.status_code == 200:
        print_success("Curso publicado exitosamente")
        return True
    else:
        print_error(f"Error al publicar curso: {response.text}")
        return False


# Función principal
def main():
    print("\n" + "="*50)
    print("  TBODEMY - TEST API")
    print("="*50 + "\n")
    
    # 1. Registrar profesor
    register_teacher()
    
    # 2. Login como profesor
    token = login_teacher()
    if not token:
        print_error("No se pudo obtener el token. Abortando.")
        return
    
    # 3. Crear curso completo
    course = create_complete_course(token)
    if not course:
        print_error("No se pudo crear el curso. Abortando.")
        return
    
    # 4. Obtener detalles del curso
    course_details = get_course_details(course['id'])
    
    # 5. Publicar el curso
    publish_course(course['id'], token)
    
    # 6. Registrar estudiante
    register_student()
    
    print("\n" + "="*50)
    print_success("¡Prueba completada exitosamente!")
    print_info("Ahora puedes:")
    print("  1. Visitar http://localhost:8000/docs para ver la API")
    print(f"  2. Ver el curso creado: http://localhost:8000/courses/{course['id']}")
    print("="*50 + "\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print_error(f"Error: {str(e)}")