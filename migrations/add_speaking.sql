-- =====================================================
-- TBODEMY - SPEAKING PRACTICE MIGRATION
-- Crea tablas para práctica de conversación con IA
-- Versión: 1.0
-- Fecha: 2025
-- =====================================================

-- =====================================================
-- 1. CREAR ENUMS
-- =====================================================

-- Tipo de conversación
DO $$ BEGIN
    CREATE TYPE conversation_type AS ENUM ('formal', 'informal', 'business', 'casual');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo conversation_type ya existe, omitiendo...';
END $$;

-- Nivel de dificultad
DO $$ BEGIN
    CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'El tipo difficulty_level ya existe, omitiendo...';
END $$;

-- =====================================================
-- 2. CREAR TABLA DE SESIONES DE SPEAKING
-- =====================================================

CREATE TABLE IF NOT EXISTS speaking_sessions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    conversation_type conversation_type NOT NULL,
    difficulty_level difficulty_level NOT NULL,
    system_prompt TEXT,  -- Prompt personalizado para la IA
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT speaking_sessions_student_check 
        CHECK (student_id IN (SELECT id FROM users WHERE role = 'student')),
    CONSTRAINT speaking_sessions_topic_length_check 
        CHECK (LENGTH(TRIM(topic)) > 0),
    CONSTRAINT speaking_sessions_ended_after_created_check 
        CHECK (ended_at IS NULL OR ended_at >= created_at)
);

-- Comentarios en la tabla
COMMENT ON TABLE speaking_sessions IS 'Sesiones de práctica de conversación con IA';
COMMENT ON COLUMN speaking_sessions.topic IS 'Tema de conversación elegido por el estudiante';
COMMENT ON COLUMN speaking_sessions.system_prompt IS 'Prompt del sistema generado según los parámetros de la sesión';
COMMENT ON COLUMN speaking_sessions.is_active IS 'Indica si la sesión está activa o finalizada';

-- =====================================================
-- 3. CREAR ÍNDICES PARA SPEAKING_SESSIONS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_student 
    ON speaking_sessions(student_id);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_active 
    ON speaking_sessions(is_active) 
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_created 
    ON speaking_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_student_active 
    ON speaking_sessions(student_id, is_active) 
    WHERE is_active = TRUE;

-- =====================================================
-- 4. CREAR TABLA DE MENSAJES DE SPEAKING
-- =====================================================

CREATE TABLE IF NOT EXISTS speaking_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES speaking_sessions(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- 'user' o 'assistant'
    content TEXT NOT NULL,  -- Texto del mensaje (transcrito o generado)
    audio_path VARCHAR(500),  -- Ruta al archivo de audio (si existe)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT speaking_messages_role_check 
        CHECK (role IN ('user', 'assistant')),
    CONSTRAINT speaking_messages_content_length_check 
        CHECK (LENGTH(TRIM(content)) > 0)
);

-- Comentarios en la tabla
COMMENT ON TABLE speaking_messages IS 'Mensajes intercambiados durante sesiones de speaking';
COMMENT ON COLUMN speaking_messages.role IS 'Rol del emisor: user (estudiante) o assistant (IA)';
COMMENT ON COLUMN speaking_messages.content IS 'Contenido del mensaje transcrito o generado';
COMMENT ON COLUMN speaking_messages.audio_path IS 'Ruta relativa al archivo de audio MP3';

-- =====================================================
-- 5. CREAR ÍNDICES PARA SPEAKING_MESSAGES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_speaking_messages_session 
    ON speaking_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_speaking_messages_created 
    ON speaking_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_speaking_messages_session_created 
    ON speaking_messages(session_id, created_at);

-- =====================================================
-- 6. CREAR FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener el conteo de mensajes por sesión
CREATE OR REPLACE FUNCTION get_speaking_session_message_count(p_session_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM speaking_messages WHERE session_id = p_session_id);
END;
$$ LANGUAGE plpgsql;

-- Función para finalizar una sesión automáticamente
CREATE OR REPLACE FUNCTION end_speaking_session(p_session_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE speaking_sessions 
    SET is_active = FALSE, 
        ended_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id 
      AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. CREAR TRIGGERS (OPCIONAL)
-- =====================================================

-- Trigger para validar que no se agreguen mensajes a sesiones finalizadas
CREATE OR REPLACE FUNCTION check_session_is_active()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM speaking_sessions 
        WHERE id = NEW.session_id AND is_active = TRUE
    ) THEN
        RAISE EXCEPTION 'No se pueden agregar mensajes a una sesión finalizada';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_speaking_messages_session_active
    BEFORE INSERT ON speaking_messages
    FOR EACH ROW
    EXECUTE FUNCTION check_session_is_active();

-- =====================================================
-- 8. DATOS DE EJEMPLO (OPCIONAL - COMENTADO)
-- =====================================================

-- Descomentar si quieres insertar datos de prueba
/*
-- Asegúrate de tener un usuario estudiante con id=1
INSERT INTO speaking_sessions (student_id, topic, conversation_type, difficulty_level, system_prompt)
VALUES (
    1, 
    'Travel and Tourism', 
    'informal', 
    'intermediate',
    'You are a friendly English conversation partner helping with travel topics.'
);

INSERT INTO speaking_messages (session_id, role, content, audio_path)
VALUES 
    (1, 'assistant', 'Hi! I''m excited to practice English with you about travel. Have you been anywhere interesting recently?', '/speaking/session_1/message_1.mp3'),
    (1, 'user', 'Yes, I went to Paris last month!', NULL),
    (1, 'assistant', 'That''s wonderful! What was your favorite thing about Paris?', '/speaking/session_1/message_3.mp3');
*/

-- =====================================================
-- 9. VERIFICACIÓN Y REPORTE
-- =====================================================

DO $$
DECLARE
    session_count INTEGER;
    message_count INTEGER;
    enum_conv_count INTEGER;
    enum_diff_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Verificar tablas
    SELECT COUNT(*) INTO session_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'speaking_sessions';
    
    SELECT COUNT(*) INTO message_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'speaking_messages';
    
    -- Verificar ENUMs
    SELECT COUNT(*) INTO enum_conv_count 
    FROM pg_type 
    WHERE typname = 'conversation_type';
    
    SELECT COUNT(*) INTO enum_diff_count 
    FROM pg_type 
    WHERE typname = 'difficulty_level';
    
    -- Verificar índices
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND (tablename = 'speaking_sessions' OR tablename = 'speaking_messages');
    
    -- Reporte
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '  TBODEMY - SPEAKING PRACTICE MIGRATION';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    
    IF session_count = 1 AND message_count = 1 AND enum_conv_count = 1 AND enum_diff_count = 1 THEN
        RAISE NOTICE '✓ Migración completada exitosamente';
        RAISE NOTICE '';
        RAISE NOTICE 'Tablas creadas:';
        RAISE NOTICE '  ✓ speaking_sessions (%)', (SELECT COUNT(*) FROM speaking_sessions);
        RAISE NOTICE '  ✓ speaking_messages (%)', (SELECT COUNT(*) FROM speaking_messages);
        RAISE NOTICE '';
        RAISE NOTICE 'ENUMs creados:';
        RAISE NOTICE '  ✓ conversation_type (4 valores)';
        RAISE NOTICE '  ✓ difficulty_level (3 valores)';
        RAISE NOTICE '';
        RAISE NOTICE 'Índices creados: %', index_count;
        RAISE NOTICE 'Funciones creadas: 2';
        RAISE NOTICE 'Triggers creados: 1';
        RAISE NOTICE '';
        RAISE NOTICE '================================================';
    ELSE
        RAISE EXCEPTION 'Error en la migración - Verificar logs';
    END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================