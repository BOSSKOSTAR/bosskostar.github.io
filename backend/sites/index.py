import json
import os
import secrets
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Управление сайтами вебмастеров и подписчиками push-уведомлений"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    action = body.get('action', 'list')

    db = get_db()
    cur = db.cursor()

    # Добавить подписчика (публичный эндпоинт)
    if action == 'subscribe':
        token = body.get('token', '')
        endpoint = body.get('endpoint', '')
        p256dh = body.get('p256dh', '')
        auth_key = body.get('auth', '')
        browser = body.get('browser', '')

        if not token or not endpoint:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Нет токена или endpoint'})}

        cur.execute("SELECT id FROM sites WHERE token = %s AND status = 'active'", (token,))
        site = cur.fetchone()
        if not site:
            db.close()
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Сайт не найден'})}

        site_id = site[0]
        cur.execute("SELECT id FROM push_subscribers WHERE endpoint = %s", (endpoint,))
        if not cur.fetchone():
            cur.execute("INSERT INTO push_subscribers (site_id, endpoint, p256dh, auth, browser) VALUES (%s, %s, %s, %s, %s)",
                        (site_id, endpoint, p256dh, auth_key, browser))
            cur.execute("UPDATE sites SET subscribers = subscribers + 1 WHERE id = %s", (site_id,))
            db.commit()

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    # Все остальные запросы требуют авторизации
    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_name, user_role = user

    # Список сайтов
    if action == 'list':
        if user_role == 'admin':
            cur.execute("SELECT s.id, s.name, s.url, s.token, s.status, s.earnings, s.subscribers, s.created_at, u.name FROM sites s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC")
        else:
            cur.execute("SELECT id, name, url, token, status, earnings, subscribers, created_at FROM sites WHERE user_id = %s ORDER BY created_at DESC", (user_id,))

        rows = cur.fetchall()
        sites = []
        for r in rows:
            s = {'id': r[0], 'name': r[1], 'url': r[2], 'token': r[3], 'status': r[4], 'earnings': float(r[5]), 'subscribers': r[6], 'created_at': str(r[7])}
            if user_role == 'admin':
                s['owner'] = r[8]
            sites.append(s)

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sites': sites})}

    # Добавить сайт
    if action == 'create':
        name = body.get('name', '').strip()
        url = body.get('url', '').strip()

        if not name or not url:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните название и URL'})}

        token = secrets.token_hex(32)
        cur.execute("INSERT INTO sites (user_id, name, url, token) VALUES (%s, %s, %s, %s) RETURNING id, token",
                    (user_id, name, url, token))
        row = cur.fetchone()
        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': row[0], 'token': row[1]})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
