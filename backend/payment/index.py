import json
import os
import hashlib
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.name, u.role, u.balance FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Пополнение баланса через ЮМани и история транзакций. v2"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    path = event.get('path', '/')
    method = event.get('httpMethod', 'GET')
    body = json.loads(event.get('body') or '{}')
    session_id = event.get('headers', {}).get('X-Session-Id', '')
    action = body.get('action', 'list')

    db = get_db()
    cur = db.cursor()

    # Webhook от ЮМани (публичный — без авторизации)
    if 'webhook' in path or action == 'webhook':
        wallet = os.environ.get('YOOMONEY_WALLET', '')
        secret = os.environ.get('YOOMONEY_SECRET', '')

        notification_type = body.get('notification_type', '')
        operation_id = body.get('operation_id', '')
        amount = body.get('amount', '0')
        currency = body.get('currency', '')
        datetime_str = body.get('datetime', '')
        sender = body.get('sender', '')
        codepro = body.get('codepro', 'false')
        label = body.get('label', '')
        sha1_hash = body.get('sha1_hash', '')

        check_str = f"{notification_type}&{operation_id}&{amount}&{currency}&{datetime_str}&{sender}&{codepro}&{secret}&{label}"
        expected_hash = hashlib.sha1(check_str.encode()).hexdigest()

        if sha1_hash != expected_hash:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': 'bad hash'}

        cur.execute("SELECT id FROM transactions WHERE payment_id = %s", (operation_id,))
        if cur.fetchone():
            db.close()
            return {'statusCode': 200, 'headers': cors, 'body': 'ok'}

        if label:
            try:
                user_id = int(label)
                cur.execute("SELECT id FROM users WHERE id = %s", (user_id,))
                if cur.fetchone():
                    cur.execute("UPDATE users SET balance = balance + %s WHERE id = %s", (float(amount), user_id))
                    cur.execute("INSERT INTO transactions (user_id, amount, type, description, payment_id) VALUES (%s, %s, 'deposit', 'Пополнение через ЮМани', %s)",
                                (user_id, float(amount), operation_id))
                    db.commit()
            except Exception:
                pass

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': 'ok'}

    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_name, user_role, user_balance = user

    # Создать ссылку на оплату
    if action == 'create':
        amount = float(body.get('amount', 0))
        if amount < 100:
            db.close()
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Минимальная сумма 100 руб'})}

        wallet = os.environ.get('YOOMONEY_WALLET', '')
        payment_url = f"https://yoomoney.ru/transfer/quickpay?receiver={wallet}&quickpay-form=shop&targets=Пополнение+баланса&paymentType=AC&sum={amount}&label={user_id}"

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'payment_url': payment_url, 'amount': amount})}

    # История транзакций
    if action == 'list':
        cur.execute("SELECT id, amount, type, description, created_at FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (user_id,))
        rows = cur.fetchall()
        transactions = [{'id': r[0], 'amount': float(r[1]), 'type': r[2], 'description': r[3], 'created_at': str(r[4])} for r in rows]
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'transactions': transactions, 'balance': float(user_balance)})}

    db.close()
    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Not found'})}