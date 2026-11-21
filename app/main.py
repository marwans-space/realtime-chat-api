from fastapi import FastAPI

app = FastAPI(title="Realtime Chat API",description="A real-time messaging API built with FastAPI",version="0.1.0")


@app.get("/")
async def root():
    return {"message": "Welcome to Realtime Chat API"}

@app.get("/health")
async def health_check():
    return {"status":"Server is healthy and working!"}
