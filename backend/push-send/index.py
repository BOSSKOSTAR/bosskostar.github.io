import json
import os
import psycopg2
from pywebpush import webpush, WebPushException

VAPID_PRIVATE_KEY = os.environ.get('VAPID_PRIVATE_KEY', '')
VAPID_PUBLIC_KEY = os.environ.get('VAPID_PUBLIC_KEY', '')
VAPID_CLAIMS = {"sub": "mailto:admin@tizerpro.ru"}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def send_push(subscription_info, title, body, icon, url):
    """Отправить одно push-уведомление"""
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": title, "body": body, "icon": icon, "url": url}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except WebPushException as e:
        if e.response and e.response.status_code in (404, 410):
            return 'expired'
        return False
    except Exception:
        return False

def handler(event: dict, context) -> dict:
    """Рассылка реальных push-уведомлений по активным тизерам"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    action = body.get('action', '')

    db = get_db()
    cur = db.cursor()

    # Публичный эндпоинт — получить VAPID публичный ключ
    if action == 'vapid_key' or (method == 'GET' and 'vapid' in event.get('path', '')):
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'public_key': VAPID_PUBLIC_KEY})}

    # Зарегистрировать показ/клик (вызывается из service worker)
    if action == 'impression':
        teaser_id = body.get('teaser_id')
        clicked = body.get('clicked', False)

        if teaser_id:
            cur.execute("SELECT cpm, budget, spent FROM teasers WHERE id = %s AND status = 'active'", (teaser_id,))
            teaser = cur.fetchone()
            if teaser:
                cpm, budget, spent = float(teaser[0]), float(teaser[1]), float(teaser[2])
                cost = cpm / 1000
                cur.execute("UPDATE teasers SET impressions = impressions + 1, spent = spent + %s WHERE id = %s", (cost, teaser_id))
                if clicked:
                    cur.execute("UPDATE teasers SET clicks = clicks + 1 WHERE id = %s", (teaser_id,))
                if spent + cost >= budget:
                    cur.execute("UPDATE teasers SET status = 'paused' WHERE id = %s", (teaser_id,))
                db.commit()

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    # Авторизованные действия
    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_role = user

    # Запустить рассылку по тизеру (только admin)
    if action == 'send' and user_role == 'admin':
        teaser_id = body.get('teaser_id')

        cur.execute("SELECT id, title, description, image_url, url FROM teasers WHERE id = %s AND status = 'active'", (teaser_id,))
        teaser = cur.fetchone()

        if not teaser:
            db.close()
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Тизер не найден или не активен'})}

        t_id, t_title, t_desc, t_icon, t_url = teaser

        cur.execute("SELECT id, endpoint, p256dh, auth FROM push_subscribers LIMIT 500")
        subscribers = cur.fetchall()

        sent, failed, expired_ids = 0, 0, []
        for sub in subscribers:
            sub_id, endpoint, p256dh, auth_key = sub
            subscription_info = {
                "endpoint": endpoint,
                "keys": {"p256dh": p256dh, "auth": auth_key}
            }
            result = send_push(subscription_info, t_title, t_desc or '', t_icon or '', t_url)
            if result is True:
                sent += 1
            elif result == 'expired':
                expired_ids.append(sub_id)
                failed += 1
            else:
                failed += 1

        if expired_ids:
            for eid in expired_ids:
                cur.execute("DELETE FROM push_subscribers WHERE id = %s", (eid,))

        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'sent': sent, 'failed': failed, 'teaser_id': t_id})}

    # Получить список активных тизеров (для показа в дашборде)
    if action == 'active_teasers':
        cur.execute("SELECT id, title, description, image_url, url FROM teasers WHERE status = 'active' AND budget > spent ORDER BY RANDOM() LIMIT 3")
        rows = cur.fetchall()
        teasers = [{'id': r[0], 'title': r[1], 'description': r[2], 'image': r[3], 'url': r[4]} for r in rows]
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'teasers': teasers})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
