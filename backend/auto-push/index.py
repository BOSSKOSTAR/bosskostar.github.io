import json
import os
import psycopg2
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS = {"sub": "mailto:admin@tizerpro.online"}
PUSH_URL = os.environ.get('PUSH_NOTIFICATIONS_URL', '')

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Автоматическая рассылка активных тизеров всем подписчикам"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}

    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'VAPID ключи не настроены'})}

    db = get_db()
    cur = db.cursor()

    # Берём все активные тизеры у которых есть бюджет
    cur.execute("""
        SELECT id, title, description, image_url, url
        FROM teasers
        WHERE status = 'active' AND budget > spent
    """)
    teasers = cur.fetchall()

    if not teasers:
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': 0, 'reason': 'Нет активных тизеров'})}

    # Берём всех подписчиков
    cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscribers")
    subscribers = cur.fetchall()

    if not subscribers:
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': 0, 'reason': 'Нет подписчиков'})}

    sent = 0
    failed = 0
    dead_endpoints = []

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
                    subscription_info={
                        'endpoint': endpoint,
                        'keys': {'p256dh': p256dh, 'auth': auth}
                    },
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims=VAPID_CLAIMS,
                )
                sent += 1
            except WebPushException as ex:
                failed += 1
                # 410 Gone = подписчик отписался, удаляем
                if ex.response and ex.response.status_code in (404, 410):
                    dead_endpoints.append(sub_id)

    # Удаляем мёртвые подписки
    for sub_id in dead_endpoints:
        cur.execute("DELETE FROM push_subscribers WHERE id = %s", (sub_id,))

    if dead_endpoints:
        db.commit()

    db.close()
    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': sent, 'failed': failed, 'removed': len(dead_endpoints)})}
