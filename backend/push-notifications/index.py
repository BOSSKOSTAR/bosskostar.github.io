import json
import os
import psycopg2
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS = {"sub": "mailto:admin@tizerpro.online"}
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute(f"SELECT u.id, u.role FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def send_to_subscribers(cur, teaser):
    teaser_id, title, description, image_url, url = teaser
    payload = json.dumps({
        'teaser_id': teaser_id,
        'title': title,
        'body': description or '',
        'icon': image_url or '/icon-192.png',
        'url': url or '/',
    })

    cur.execute(f"SELECT id, endpoint, p256dh, auth FROM {SCHEMA}.push_subscribers WHERE endpoint != 'disabled'")
    subscribers = cur.fetchall()

    sent = 0
    dead = []
    for sub in subscribers:
        sub_id, endpoint, p256dh, auth = sub
        try:
            webpush(
                subscription_info={'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth}},
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
                timeout=10,
            )
            sent += 1
        except WebPushException as ex:
            if ex.response and ex.response.status_code in (404, 410):
                dead.append(sub_id)

    for sub_id in dead:
        cur.execute(f"UPDATE {SCHEMA}.push_subscribers SET endpoint = 'disabled' WHERE id = %s", (sub_id,))

    return sent

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
            cur.execute(f"SELECT cpm, budget, spent FROM {SCHEMA}.teasers WHERE id = %s AND status = 'active'", (teaser_id,))
            row = cur.fetchone()
            if row:
                cpm, budget, spent = float(row[0]), float(row[1]), float(row[2])
                cost = cpm / 1000
                cur.execute(f"UPDATE {SCHEMA}.teasers SET impressions = impressions + 1, spent = spent + %s WHERE id = %s", (cost, teaser_id))
                if clicked:
                    cur.execute(f"UPDATE {SCHEMA}.teasers SET clicks = clicks + 1 WHERE id = %s", (teaser_id,))
                if spent + cost >= budget:
                    cur.execute(f"UPDATE {SCHEMA}.teasers SET status = 'paused' WHERE id = %s", (teaser_id,))
                db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    if action == 'auto_send':
        cur.execute(f"SELECT id, title, description, image_url, url FROM {SCHEMA}.teasers WHERE status = 'active' AND budget > spent")
        teasers = cur.fetchall()
        total_sent = 0
        for teaser in teasers:
            total_sent += send_to_subscribers(cur, teaser)
        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': total_sent})}

    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_role = user

    if action == 'send' and user_role == 'admin':
        teaser_id = body.get('teaser_id')
        cur.execute(f"SELECT id, title, description, image_url, url FROM {SCHEMA}.teasers WHERE id = %s AND status = 'active'", (teaser_id,))
        teaser = cur.fetchone()
        if not teaser:
            db.close()
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Тизер не найден'})}
        sent = send_to_subscribers(cur, teaser)
        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': sent, 'failed': 0})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
