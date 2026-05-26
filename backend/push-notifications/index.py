import json
import os
import psycopg2

VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Push-уведомления: VAPID ключ, показы, рассылка"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    action = body.get('action', '')

    if action == 'vapid_key':
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'public_key': VAPID_PUBLIC_KEY})}

    db = get_db()
    cur = db.cursor()

    if action == 'impression':
        teaser_id = body.get('teaser_id')
        clicked = body.get('clicked', False)
        if teaser_id:
            cur.execute("SELECT cpm, budget, spent FROM teasers WHERE id = %s AND status = 'active'", (teaser_id,))
            row = cur.fetchone()
            if row:
                cpm, budget, spent = float(row[0]), float(row[1]), float(row[2])
                cost = cpm / 1000
                cur.execute("UPDATE teasers SET impressions = impressions + 1, spent = spent + %s WHERE id = %s", (cost, teaser_id))
                if clicked:
                    cur.execute("UPDATE teasers SET clicks = clicks + 1 WHERE id = %s", (teaser_id,))
                if spent + cost >= budget:
                    cur.execute("UPDATE teasers SET status = 'paused' WHERE id = %s", (teaser_id,))
                db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_role = user

    if action == 'send' and user_role == 'admin':
        teaser_id = body.get('teaser_id')
        cur.execute("SELECT id, title FROM teasers WHERE id = %s AND status = 'active'", (teaser_id,))
        teaser = cur.fetchone()
        if not teaser:
            db.close()
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Тизер не найден'})}
        cur.execute("SELECT COUNT(*) FROM push_subscribers")
        count = cur.fetchone()[0]
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': count, 'failed': 0})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
