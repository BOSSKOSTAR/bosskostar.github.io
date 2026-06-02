import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_user(cur, session_id):
    cur.execute("SELECT u.id, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = %s AND s.expires_at > NOW()", (session_id,))
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Статистика платформы для рекламодателей, вебмастеров и админов"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    body = json.loads(event.get('body') or '{}')
    action = body.get('action', 'get')
    session_id = event.get('headers', {}).get('X-Session-Id', '')

    db = get_db()
    cur = db.cursor()

    user = get_user(cur, session_id)
    if not user:
        db.close()
        return {'statusCode': 401, 'headers': cors, 'body': json.dumps({'error': 'Не авторизован'})}

    user_id, user_role = user

    if user_role == 'admin':
        cur.execute("SELECT COUNT(*) FROM users WHERE role = 'advertiser'")
        advertisers = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM users WHERE role = 'webmaster'")
        webmasters = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM teasers WHERE status = 'active'")
        active_teasers = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM teasers WHERE status = 'pending'")
        pending_teasers = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM push_subscribers")
        total_subscribers = cur.fetchone()[0]
        cur.execute("SELECT COALESCE(SUM(amount),0) FROM transactions WHERE type = 'deposit'")
        total_deposits = cur.fetchone()[0]

        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'advertisers': advertisers, 'webmasters': webmasters,
            'active_teasers': active_teasers, 'pending_teasers': pending_teasers,
            'total_subscribers': total_subscribers, 'total_deposits': float(total_deposits)
        })}

    elif user_role == 'advertiser':
        SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

        if action == 'daily_stats':
            days = int(body.get('days', 14))
            cur.execute(f"""
                SELECT DATE(i.created_at) as day,
                       COUNT(*) as impressions,
                       SUM(CASE WHEN i.clicked THEN 1 ELSE 0 END) as clicks
                FROM {SCHEMA}.impressions i
                JOIN {SCHEMA}.teasers t ON i.teaser_id = t.id
                WHERE t.user_id = %s AND i.created_at >= NOW() - INTERVAL '{days} days'
                GROUP BY DATE(i.created_at)
                ORDER BY day ASC
            """, (user_id,))
            rows = cur.fetchall()
            db.close()
            return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
                'daily': [{'date': str(r[0]), 'impressions': r[1], 'clicks': r[2]} for r in rows]
            })}

        cur.execute(f"SELECT COUNT(*), COALESCE(SUM(impressions),0), COALESCE(SUM(clicks),0), COALESCE(SUM(spent),0), COALESCE(SUM(budget),0) FROM {SCHEMA}.teasers WHERE user_id = %s", (user_id,))
        r = cur.fetchone()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'total_teasers': r[0], 'total_impressions': r[1], 'total_clicks': r[2],
            'total_spent': float(r[3]), 'total_budget': float(r[4]),
            'ctr': round(r[2] / r[1] * 100, 2) if r[1] > 0 else 0
        })}

    else:
        cur.execute("SELECT COUNT(*), COALESCE(SUM(subscribers),0), COALESCE(SUM(earnings),0) FROM sites WHERE user_id = %s", (user_id,))
        r = cur.fetchone()
        db.close()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({
            'total_sites': r[0], 'total_subscribers': r[1], 'total_earnings': float(r[2])
        })}