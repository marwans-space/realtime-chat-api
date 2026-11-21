from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
async def health_check():
    return {"status":"Server is healthy and working!"}
