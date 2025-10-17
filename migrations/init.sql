-- =====================================================
-- TBODEMY - Script de Inicialización de Base de Datos
-- =====================================================

-- Crear la base de datos (ejecutar como usuario postgres)
-- CREATE DATABASE tbodemy;

-- Conectarse a la base de datos
\c tbodemy;

-- Crear tipos ENUM
CREATE TYPE user_role AS ENUM ('student', 'teacher');
CREATE TYPE quiz_type AS ENUM ('fill_blank', 'multiple_choice');

-- =====================================================
-- Tabla: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- Tabla: courses
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_published ON courses(is_published);

-- =====================================================
-- Tabla: units
-- =====================================================
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    "order" INTEGER NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_positive CHECK ("order" >= 0)
);

CREATE INDEX idx_units_course ON units(course_id);
CREATE INDEX idx_units_order ON units(course_id, "order");

-- =====================================================
-- Tabla: quizzes
-- =====================================================
CREATE TABLE IF NOT EXISTS quizzes (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    quiz_type quiz_type NOT NULL,
    question TEXT NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    options JSONB,
    "order" INTEGER NOT NULL,
    CONSTRAINT quiz_order_positive CHECK ("order" >= 0)
);

CREATE INDEX idx_quizzes_unit ON quizzes(unit_id);
CREATE INDEX idx_quizzes_order ON quizzes(unit_id, "order");

-- =====================================================
-- Tabla: audio_sentences
-- =====================================================
CREATE TABLE IF NOT EXISTS audio_sentences (
    id SERIAL PRIMARY KEY,
    unit_id INTEGER NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    sentence TEXT NOT NULL,
    audio_path VARCHAR(500) NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT audio_order_positive CHECK ("order" >= 0)
);

CREATE INDEX idx_audio_unit ON audio_sentences(unit_id);
CREATE INDEX idx_audio_order ON audio_sentences(unit_id, "order");

-- =====================================================
-- Tabla: enrollments
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    progress JSONB DEFAULT '{}'::jsonb,
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- =====================================================
-- Trigger para actualizar updated_at en courses
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_courses_updated_at 
    BEFORE UPDATE ON courses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Función para obtener estadísticas de un curso
-- =====================================================
CREATE OR REPLACE FUNCTION get_course_stats(course_id_param INTEGER)
RETURNS TABLE (
    total_units INTEGER,
    total_quizzes INTEGER,
    total_audios INTEGER,
    total_students INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT u.id)::INTEGER as total_units,
        COUNT(DISTINCT q.id)::INTEGER as total_quizzes,
        COUNT(DISTINCT a.id)::INTEGER as total_audios,
        COUNT(DISTINCT e.id)::INTEGER as total_students
    FROM courses c
    LEFT JOIN units u ON u.course_id = c.id
    LEFT JOIN quizzes q ON q.unit_id = u.id
    LEFT JOIN audio_sentences a ON a.unit_id = u.id
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE c.id = course_id_param
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Datos de ejemplo (comentado, descomenta si quieres)
-- =====================================================

/*
-- Insertar un profesor de ejemplo
INSERT INTO users (email, password, name, role) VALUES
('teacher@tbodemy.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvCnNP5z.W7W', 'Professor Smith', 'teacher');
-- Password: teacher123

-- Insertar un estudiante de ejemplo
INSERT INTO users (email, password, name, role) VALUES
('student@tbodemy.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5yvCnNP5z.W7W', 'John Student', 'student');
-- Password: student123

-- Insertar un curso de ejemplo
INSERT INTO courses (title, description, teacher_id, is_published) VALUES
('English for Beginners', 'Complete course for English beginners', 1, true);

-- Insertar una unidad de ejemplo
INSERT INTO units (course_id, title, "order", content) VALUES
(1, 'Unit 1: Greetings', 0, '<h2>Welcome!</h2><p>Learn basic greetings in English.</p>');

-- Insertar un quiz de ejemplo
INSERT INTO quizzes (unit_id, quiz_type, question, correct_answer, "order") VALUES
(1, 'fill_blank', 'Hello, [how] are you?', 'how', 0);

-- Insertar un audio de ejemplo
INSERT INTO audio_sentences (unit_id, sentence, audio_path, "order") VALUES
(1, 'Hello, how are you?', '/audio/hello.mp3', 0);
*/

-- =====================================================
-- Verificación
-- =====================================================

-- Verificar tablas creadas
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Mostrar resumen
SELECT 'Base de datos inicializada correctamente' AS status;