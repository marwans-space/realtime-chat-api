from pwdlib import PasswordHash
from core.config import get_settings
import jwt
import datetime

hasher = PasswordHash.recommended()
jwt_secret = get_settings().jwt_secret.get_secret_value()

# Hashing
def hash_password(password: str) -> str:
    return hasher.hash(password)

# Verify
def verify_password(password: str, password_hash: str) -> bool:
    return hasher.verify(password,password_hash)

# Create token
def create_access_token(user_id: int) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    PAYLOAD = {
        "sub": str(user_id),
        "iat": now,
    "exp": now + datetime.timedelta(hours=24),
    }
    return jwt.encode(PAYLOAD, jwt_secret, algorithm="HS256")

# Decode token
def decode_access_token(token: str) -> dict:
    return jwt.decode(token,jwt_secret,algorithms=["HS256"])