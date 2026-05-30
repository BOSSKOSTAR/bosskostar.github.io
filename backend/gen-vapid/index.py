import json
from py_vapid import Vapid

def handler(event: dict, context) -> dict:
    """Генерация VAPID ключей для push-уведомлений"""

    cors = {'Access-Control-Allow-Origin': '*'}

    v = Vapid()
    v.generate_keys()

    private_key = v.private_pem().decode().strip()
    public_key = v.public_key

    from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
    import base64
    pub_bytes = public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    pub_b64 = base64.urlsafe_b64encode(pub_bytes).rstrip(b'=').decode()

    return {
        'statusCode': 200,
        'headers': cors,
        'body': json.dumps({
            'private_key': private_key,
            'public_key': pub_b64,
        })
    }
