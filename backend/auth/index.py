import json
import os
import hashlib
import secrets
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: dict, context) -> dict:
    """Регистрация и вход пользователей платформы тизерной рекламы. v4"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', '')

    db = get_db()
    cur = db.cursor()

    # Определяем действие: по пути ИЛИ по полю action в теле
    is_register = 'register' in path or action == 'register'
    is_login = 'login' in path or action == 'login'
    is_me = 'me' in path or action == 'me'
    is_logout = 'logout' in path or action == 'logout'

    # Регистрация
    if method == 'POST' and is_register:
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')
        name = body.get('name', '').strip()
        role = body.get('role', 'advertiser')
        ref_code = body.get('ref_code', '').strip().upper()

        if not email or not password or not name:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните все поля'})}

        if role not in ('advertiser', 'webmaster'):
            role = 'advertiser'

        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            db.close()
            return {'statusCode': 409, 'headers': cors, 'body': json.dumps({'error': 'Email уже зарегистрирован'})}

        referred_by = None
        if ref_code:
            cur.execute("SELECT id FROM users WHERE ref_code = %s", (ref_code,))
            ref_row = cur.fetchone()
            if ref_row:
                referred_by = ref_row[0]

        cur.execute("INSERT INTO users (email, password_hash, name, role, referred_by) VALUES (%s, %s, %s, %s, %s) RETURNING id",
                    (email, hash_password(password), name, role, referred_by))
        user_id = cur.fetchone()[0]

        new_ref_code = secrets.token_hex(4).upper()
        cur.execute("UPDATE users SET ref_code = %s WHERE id = %s", (new_ref_code, user_id))

        session_id = secrets.token_hex(32)
        cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user_id))
        db.commit()
        db.close()

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'session_id': session_id, 'user_id': user_id, 'role': role, 'name': name})}

    # Вход
    if method == 'POST' and is_login:
        email = body.get('email', '').strip().lower()
        password = body.get('password', '')

        cur.execute("SELECT id, name, role, balance FROM users WHERE email = %s AND password_hash = %s",
                    (email, hash_password(password)))
        user = cur.fetchone()

        if not user:
            db.close()
            return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        session_id = secrets.token_hex(32)
        cur.execute("INSERT INTO sessions (id, user_id) VALUES (%s, %s)", (session_id, user[0]))
        db.commit()
        db.close()

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'session_id': session_id, 'user_id': user[0], 'name': user[1], 'role': user[2], 'balance': float(user[3])})}

    # Профиль
    if is_me:
        session_id = event.get('headers', {}).get('X-Session-Id', '')
        cur.execute("SELECT u.id, u.name, u.email, u.role, u.balance, u.ref_code FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
        user = cur.fetchone()
        db.close()

        if not user:
            return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': user[0], 'name': user[1], 'email': user[2], 'role': user[3], 'balance': float(user[4]), 'ref_code': user[5]})}

    # Выход
    if method == 'POST' and is_logout:
        session_id = event.get('headers', {}).get('X-Session-Id', '')
        cur.execute("UPDATE sessions SET expires_at = NOW() WHERE id = %s", (session_id,))
        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}