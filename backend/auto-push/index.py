import json
import os
import base64
import psycopg2
from pywebpush import webpush, WebPushException
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PrivateFormat, NoEncryption

VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '').strip()
VAPID_CLAIMS = {"sub": "mailto:admin@tizerpro.online"}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_private_key():
    key = os.environ.get('VAPID_PRIVATE_KEY', '').strip()
    if key.startswith('-----'):
        private_key = load_pem_private_key(key.encode(), password=None)
        der = private_key.private_bytes(Encoding.DER, PrivateFormat.PKCS8, NoEncryption())
        return base64.urlsafe_b64encode(der).rstrip(b'=').decode()
    return key

def handler(event: dict, context) -> dict:
    """Автоматическая рассылка активных тизеров всем подписчикам — вызывается по расписанию"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}

    private_key = get_private_key()
    if not private_key:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'VAPID ключи не настроены'})}

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT id, title, description, image_url, url FROM teasers WHERE status = 'active' AND budget > spent")
    teasers = cur.fetchall()

    if not teasers:
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': 0, 'reason': 'Нет активных тизеров'})}

    cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscribers")
    subscribers = cur.fetchall()

    if not subscribers:
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': 0, 'reason': 'Нет подписчиков'})}

    sent = 0
    dead = []

    for teaser in teasers:
        teaser_id, title, description, image_url, url = teaser
        payload = json.dumps({
            'teaser_id': teaser_id,
            'title': title,
            'body': description or '',
            'icon': image_url or '/icon-192.png',
            'url': url or '/',
        })
        for sub in subscribers:
            sub_id, endpoint, p256dh, auth = sub
            try:
                webpush(
                    subscription_info={'endpoint': endpoint, 'keys': {'p256dh': p256dh, 'auth': auth}},
                    data=payload,
                    vapid_private_key=private_key,
                    vapid_claims=VAPID_CLAIMS,
                )
                sent += 1
            except WebPushException as ex:
                if ex.response and ex.response.status_code in (404, 410):
                    dead.append(sub_id)

    for sub_id in set(dead):
        cur.execute("DELETE FROM push_subscribers WHERE id = %s", (sub_id,))

    db.commit()
    db.close()
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': sent, 'removed': len(set(dead))})}
