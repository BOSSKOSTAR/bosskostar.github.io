-- Одобрить тизер
UPDATE teasers SET status = 'active' WHERE id = 1;

-- Создать admin аккаунт (пароль: admin123)
INSERT INTO users (email, password_hash, name, role, balance)
VALUES ('admin@tizerpro.ru', encode(sha256('admin123'::bytea), 'hex'), 'Администратор', 'admin', 0)
ON CONFLICT (email) DO NOTHING;
