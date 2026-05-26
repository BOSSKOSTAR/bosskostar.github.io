import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Запуск рассылки push-уведомлений по тизеру (симуляция показов)"""
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}
    
    cors = {'Access-Control-Allow-Origin': '*'}
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    
    db = get_db()
    cur = db.cursor()
    
    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}
    
    user_id, user_role = user
    
    # Получить активные тизеры для показа (публичный — для service worker)
    if method == 'GET':
        cur.execute("SELECT id, title, description, image_url, url FROM teasers WHERE status = 'active' AND budget > spent ORDER BY created_at LIMIT 3")
        rows = cur.fetchall()
        teasers = [{'id': r[0], 'title': r[1], 'description': r[2], 'image': r[3], 'url': r[4]} for r in rows]
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'teasers': teasers})}
    
    # Зарегистрировать показ/клик
    if method == 'POST':
        teaser_id = body.get('teaser_id')
        clicked = body.get('clicked', False)
        
        if not teaser_id:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Нет teaser_id'})}
        
        cur.execute("SELECT cpm, budget, spent FROM teasers WHERE id = %s AND status = 'active'", (teaser_id,))
        teaser = cur.fetchone()
        
        if not teaser:
            db.close()
            return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Тизер не найден'})}
        
        cpm, budget, spent = float(teaser[0]), float(teaser[1]), float(teaser[2])
        cost = cpm / 1000
        
        cur.execute("UPDATE teasers SET impressions = impressions + 1, spent = spent + %s WHERE id = %s", (cost, teaser_id))
        
        if clicked:
            cur.execute("UPDATE teasers SET clicks = clicks + 1 WHERE id = %s", (teaser_id,))
        
        if spent + cost >= budget:
            cur.execute("UPDATE teasers SET status = 'paused' WHERE id = %s", (teaser_id,))
        
        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True, 'cost': cost})}
    
    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
