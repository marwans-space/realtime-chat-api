from pydantic import BaseModel, EmailStr, Field

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=8)

class UserLogin(BaseModel):
    identifier: str = Field(min_length=1)
    password: str = Field(min_length=8)