
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="AI Sound Detection API",
    description="Backend for environmental sound and keyword detection",
    version="0.1.0",
)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR.parent / "datasets" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"
}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "AI Sound Detection API is running",
        "model_status": "not_loaded",
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "audio_model": "not_loaded",
    }


@app.post("/api/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format.",
        )

    content = await file.read(MAX_FILE_SIZE + 1)

    if not content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Maximum upload size is 25 MB.",
        )

    saved_name = f"{uuid4().hex}{extension}"
    saved_path = UPLOAD_DIR / saved_name
    saved_path.write_bytes(content)

    return {
        "message": "Audio uploaded successfully",
        "filename": original_name,
        "file_size_bytes": len(content),
        "saved_file": saved_name,
        "detection_status": "pending_model_integration",
    }
