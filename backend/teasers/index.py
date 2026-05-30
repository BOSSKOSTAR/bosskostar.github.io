import json
import os
import re
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

# Запрещённые тематики по законодательству РФ
BANNED_KEYWORDS = [
    # Наркотики
    'наркотик', 'героин', 'кокаин', 'марихуана', 'мефедрон', 'амфетамин', 'экстази',
    'спайс', 'соль', 'закладк', 'дурь', 'трава', 'фен', 'мет', 'lsd', 'mdma',
    # Оружие
    'оружие', 'пистолет', 'автомат', 'взрывчатк', 'граната', 'бомб',
    # Азартные игры (без лицензии)
    'казино', 'ставки', 'букмекер', 'slot', 'покер', 'рулетк',
    # Финансовые пирамиды / мошенничество
    'пирамид', 'хайп', 'hyip', 'быстрый заработок', 'гарантированный доход',
    'удвоим', 'вложи и получи', 'инвестируй и забирай',
    # Эротика / порно
    'порно', 'эротик', 'секс-', 'интим', 'проститут', 'эскорт',
    # Алкоголь и табак (реклама запрещена)
    'купи водку', 'купи вино', 'купи пиво', 'купи сигарет', 'купи табак',
    # Медикаменты без рецепта
    'без рецепта', 'купи таблетки', 'купи лекарств',
    # Экстремизм
    'экстремизм', 'терроризм', 'isis', 'игил',
]

def check_content(text):
    text_lower = text.lower()
    for kw in BANNED_KEYWORDS:
        if kw in text_lower:
            return kw
    return None

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute(f"SELECT u.id, u.name, u.role, u.balance FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Управление тизерами рекламодателей с автомодерацией"""

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
            cur.execute(f"SELECT t.id, t.title, t.description, t.image_url, t.url, t.status, t.budget, t.spent, t.cpm, t.impressions, t.clicks, t.created_at, u.name FROM {SCHEMA}.teasers t JOIN {SCHEMA}.users u ON t.user_id = u.id ORDER BY t.created_at DESC")
        else:
            cur.execute(f"SELECT id, title, description, image_url, url, status, budget, spent, cpm, impressions, clicks, created_at FROM {SCHEMA}.teasers WHERE user_id = %s ORDER BY created_at DESC", (user_id,))

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
        description = body.get('description', '').strip()
        url = body.get('url', '').strip()
        budget = float(body.get('budget', 0))
        cpm = float(body.get('cpm', 50))

        if not title or not url:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Заполните заголовок и ссылку'})}

        if budget > float(user_balance):
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Недостаточно средств на балансе'})}

        # Автомодерация — проверка на запрещённый контент
        check_text = f"{title} {description} {url}"
        banned_kw = check_content(check_text)
        if banned_kw:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': f'Реклама отклонена: запрещённый контент по законодательству РФ'})}

        # Автоматически активируем тизер
        cur.execute(f"INSERT INTO {SCHEMA}.teasers (user_id, title, description, image_url, url, budget, cpm, status) VALUES (%s, %s, %s, %s, %s, %s, %s, 'active') RETURNING id",
                    (user_id, title, description, body.get('image_url', ''), url, budget, cpm))
        teaser_id = cur.fetchone()[0]

        if budget > 0:
            cur.execute(f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s", (budget, user_id))
            cur.execute(f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'spend', %s)",
                        (user_id, -budget, f'Бюджет тизера #{teaser_id}'))

        db.commit()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'id': teaser_id, 'status': 'active'})}

    # Обновить статус (admin)
    if action == 'update' and user_role == 'admin':
        teaser_id = body.get('id')
        status = body.get('status', 'active')
        if teaser_id:
            cur.execute(f"UPDATE {SCHEMA}.teasers SET status = %s WHERE id = %s", (status, teaser_id))
            db.commit()
            db.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'ok': True})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}
