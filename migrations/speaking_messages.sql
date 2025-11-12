-- Migración para agregar corrected_content a speaking_messages
-- Ejecutar este script en tu base de datos

-- SQLite
ALTER TABLE speaking_messages 
ADD COLUMN corrected_content TEXT;

-- PostgreSQL
-- ALTER TABLE speaking_messages 
-- ADD COLUMN corrected_content TEXT;

-- MySQL
-- ALTER TABLE speaking_messages 
-- ADD COLUMN corrected_content TEXT;

-- Verificar que se agregó correctamente
-- SQLite/PostgreSQL/MySQL:
-- SELECT * FROM speaking_messages LIMIT 1;