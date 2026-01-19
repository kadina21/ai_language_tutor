import requests
import json
import re
from prompts import get_lesson_prompt

OLLAMA_URL = "http://localhost:11434/api/generate"


def extract_json_from_response(response_text: str) -> dict:
    """Extract JSON from LLM response, handling potential markdown code blocks."""
    # Try to find JSON in code blocks first
    code_block_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
    if code_block_match:
        json_str = code_block_match.group(1)
    else:
        # Try to find JSON directly (starts with { and ends with })
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response_text
    
    return json.loads(json_str)


def generate_lesson(language: str, topic: str) -> dict:
    """Generate a lesson with vocabulary for the given language and topic."""
    prompt = get_lesson_prompt(language, topic)

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": "translategemma:12b",
            "prompt": prompt,
            "stream": False,
            "context": None
        },
        timeout=60
    )

    response_text = response.json()["response"]
    
    try:
        lesson_data = extract_json_from_response(response_text)
        return {
            "lesson": lesson_data.get("lesson_text", response_text),
            "vocabulary": lesson_data.get("vocabulary", [])
        }
    except (json.JSONDecodeError, KeyError):
        # Fallback if JSON parsing fails - return raw text
        return {
            "lesson": response_text,
            "vocabulary": []
        }


def generate_exercise(language: str, vocabulary: list) -> dict:
    """Generate an exercise based on vocabulary words.
    
    Uses the exact vocabulary and translations from the lesson to ensure
    the correct answers match what the user learned.
    """
    if not vocabulary:
        return {"error": "No vocabulary provided for exercise generation"}
    
    # Directly create the exercise from the lesson vocabulary
    # This ensures the correct answers match exactly what was shown in the lesson
    return create_exercise_from_vocabulary(language, vocabulary)


def create_exercise_from_vocabulary(language: str, vocabulary: list) -> dict:
    """Create an exercise directly from the lesson vocabulary.
    
    This ensures the correct answers match exactly what was shown in the lesson.
    Only uses vocabulary from the lesson itself - no off-topic words.
    """
    import random
    
    questions = []
    
    # Get all translations from this lesson's vocabulary
    all_translations = [v["translation"] for v in vocabulary]
    
    for i, word in enumerate(vocabulary):
        correct = word["translation"]
        
        # Get other translations from the vocabulary as wrong options
        # Only use words from the same lesson to stay on topic
        other_translations = [v["translation"] for v in vocabulary if v["translation"] != correct]
        
        # Shuffle the wrong options and take up to 3
        random.shuffle(other_translations)
        wrong_options = other_translations[:3]
        
        # Build options list: correct answer + wrong options from the same lesson
        options = [correct] + wrong_options
        
        # Shuffle options so the correct answer isn't always first
        random.shuffle(options)
        
        questions.append({
            "id": i + 1,
            "word": word["word"],
            "pronunciation": word.get("pronunciation", ""),
            "correct_answer": correct,
            "options": options
        })
    
    return {
        "exercise_type": "matching",
        "instructions": f"Match each {language} word with its correct English translation from the lesson",
        "questions": questions
    }
