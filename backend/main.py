from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from llm import generate_lesson, generate_exercise
from tts import synthesize_speech

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the frontend directory path (one level up from backend)
frontend_dir = Path(__file__).parent.parent / "frontend"

# Serve static files (CSS, JS)
app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")


class VocabularyItem(BaseModel):
    word: str
    translation: str
    pronunciation: Optional[str] = ""


class ExerciseRequest(BaseModel):
    language: str
    vocabulary: List[VocabularyItem]


# Serve the HTML file at root
@app.get("/")
async def read_root():
    return FileResponse(str(frontend_dir / "index.html"))


@app.get("/api/languages")
def get_languages():
    # Return data for populating a dropdown with Tamazight languages and a "Start" button
    return {
        "languages": [
            {"label": "Kabyle", "value": "Kabyle"},
            {"label": "Central Atlas Tamazight", "value": "Central Atlas Tamazight"},
            {"label": "Tarifit", "value": "Tarifit"},
        ],
        "button_text": "Start",
        "instructions": "Select a language and press Start to continue."
    }


@app.get("/api/list")
def list():
    # Generate a list of up to 5 example lessons for selection
    lessons = [
        {"id": 1, "title": "Greetings", "description": "Learn how to greet in Central Atlas Tamazight."},
        {"id": 2, "title": "Numbers", "description": "Counting from 1 to 10 in Central Atlas Tamazight."},
        {"id": 3, "title": "Family", "description": "Basic family member vocabulary in Central Atlas Tamazight."},
        {"id": 4, "title": "Food", "description": "Common foods and phrases in Central Atlas Tamazight."},
        {"id": 5, "title": "Simple Sentences", "description": "Constructing basic sentences in Central Atlas Tamazight."},
    ]
    return {"lessons": lessons}


@app.get("/api/lesson")
def lesson(language: str = "Central Atlas Tamazight", topic: str = "Greetings"):
    return generate_lesson(language, topic)


@app.post("/api/exercise")
def exercise(request: ExerciseRequest):
    """Generate an exercise based on the vocabulary from a lesson."""
    vocabulary = [item.model_dump() for item in request.vocabulary]
    return generate_exercise(request.language, vocabulary)


@app.post("/api/tts")
def text_to_speech(request: dict):
    """Generate speech from Tamazight text."""
    text = request.get("text", "")
    language = request.get("language", "Central Atlas Tamazight")
    
    if not text:
        return {"error": "No text provided"}
    
    return synthesize_speech(text, language)
