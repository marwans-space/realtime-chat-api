from pydantic import BaseModel


class UserSearchResult(BaseModel):
    id: int
    username: str
