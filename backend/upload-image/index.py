import json
import os
import base64
import uuid
import boto3

def handler(event: dict, context) -> dict:
    """Загрузка изображения тизера в S3"""

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    cors = {'Access-Control-Allow-Origin': '*'}
    body = json.loads(event.get('body') or '{}')

    image_b64 = body.get('image')
    content_type = body.get('content_type', 'image/jpeg')

    if not image_b64:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Нет изображения'}, ensure_ascii=False)}

    allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if content_type not in allowed_types:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Недопустимый формат'})}

    ext_map = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'}
    ext = ext_map.get(content_type, 'jpg')

    image_data = base64.b64decode(image_b64)

    if len(image_data) > 5 * 1024 * 1024:
        return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Файл слишком большой (макс. 5 МБ)'})}

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    key = f"teasers/{uuid.uuid4()}.{ext}"
    s3.put_object(Bucket='files', Key=key, Body=image_data, ContentType=content_type)

    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'url': url})}