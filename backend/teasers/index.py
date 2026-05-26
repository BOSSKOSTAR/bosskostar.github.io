import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.name, u.role, u.balance FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Управление тизерами рекламодателей"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    action = body.get('action', 'list')

    db = get_db()
    cur = db.cursor()

    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_name, user_role, user_balance = user

    # Список тизеров
    if action == 'list':
        if user_role == 'admin':
            cur.execute("SELECT t.id, t.title, t.description, t.image_url, t.url, t.status, t.budget, t.spent, t.cpm, t.impressions, t.clicks, t.created_at, u.name FROM teasers t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC")
        else:
            cur.execute("SELECT id, title, description, image_url, url, status, budget, spent, cpm, impressions, clicks, created_at FROM teasers WHERE user_id = %s ORDER BY created_at DESC", (user_id,))

        rows = cur.fetchall()
        teasers = []
        for r in rows:
            t = {'id': r[0], 'title': r[1], 'description': r[2], 'image_url': r[3], 'url': r[4], 'status': r[5], 'budget': float(r[6]), 'spent': float(r[7]), 'cpm': float(r[8]), 'impressions': r[9], 'clicks': r[10], 'created_at': str(r[11])}
            if user_role == 'admin':
                t['owner'] = r[12]
            teasers.append(t)

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'teasers': teasers})}

    # Создать тизер
    if action == 'create':
        title = body.get('title', '').strip()
        url = body.get('url', '').strip()
        budget = float(body.get('budget', 0))
        cpm = float(body.get('cpm', 50))

        if not title or not url:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните заголовок и ссылку'})}

        if budget > float(user_balance):
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Недостаточно средств на балансе'})}

        cur.execute("INSERT INTO teasers (user_id, title, description, image_url, url, budget, cpm, status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'pending') RETURNING id",
                    (user_id, title, body.get('description', ''), body.get('image_url', ''), url, budget, cpm))
        teaser_id = cur.fetchone()[0]

        if budget > 0:
            cur.execute("UPDATE users SET balance = balance - %s WHERE id = %s", (budget, user_id))
            cur.execute("INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, 'spend', %s)",
                        (user_id, -budget, f'Бюджет тизера #{teaser_id}'))

        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': teaser_id, 'status': 'pending'})}

    # Обновить статус (admin)
    if action == 'update' and user_role == 'admin':
        teaser_id = body.get('id')
        status = body.get('status', 'active')
        if teaser_id:
            cur.execute("UPDATE teasers SET status = %s WHERE id = %s", (status, teaser_id))
            db.commit()
            db.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
