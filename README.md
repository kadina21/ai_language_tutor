# AI Language Tutor

An interactive web application for learning Tamazight languages powered by AI. The tutor generates personalized lessons and exercises on demand, providing vocabulary, pronunciation guides, and practical exercises to enhance your learning experience.

## Overview

**AI Language Tutor** is a full-stack application that combines a FastAPI backend with Ollama's local LLM inference to create dynamic language lessons. Users select a Tamazight language variant (Kabyle, Central Atlas Tamazight, or Tarifit), choose a lesson topic, and receive AI-generated lessons with vocabulary and exercises tailored to their needs.

## Features

- **Dynamic Lesson Generation**: AI-powered lessons with vocabulary and pronunciation guides
- **Interactive Exercises**: Auto-generated multiple-choice exercises based on lesson content
- **Text-to-Speech**: Audio pronunciation support for learned vocabulary
- **Multi-Language Support**: Focused on Tamazight variants (Kabyle, Central Atlas Tamazight, Tarifit)
- **Structured Topics**: Pre-configured lesson topics including Greetings, Numbers, Family, Food, and more
- **Responsive Design**: Clean, intuitive web interface for seamless learning

## Project Structure

```
ai_language_tutor/
├── backend/
│   ├── llm.py              # LLM client and response parsing
│   ├── main.py             # FastAPI server and API endpoints
│   ├── prompts.py          # Lesson prompt templates and builders
│   └── tts.py              # Text-to-speech functionality
├── frontend/
│   ├── index.html          # Main UI structure
│   ├── script.js           # Client-side logic and API integration
│   └── style.css           # Responsive styling
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

## Tech Stack

- **Backend**: FastAPI 0.104.1, Uvicorn
- **LLM**: Ollama with `translategemma:12b` model
- **ML Libraries**: Transformers, PyTorch, SciPy, NumPy
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Server**: Python 3.10+

## Prerequisites

- **Python 3.10+**
- **pip** (Python package manager)
- **Ollama** (for local LLM inference)
  - Download from [ollama.ai](https://ollama.ai)
  - Pull the `translategemma:12b` model: `ollama pull translategemma:12b`

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai_language_tutor
```

### 2. Create and Activate Virtual Environment

```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Start Ollama Service

Ensure Ollama is running (required for LLM inference):

```bash
ollama serve
```

The server should be accessible at `http://localhost:11434`.

### 5. Run the Application

```bash
python backend/main.py
```

The application will start on `http://localhost:8000`

Open your browser and navigate to `http://localhost:8000` to access the tutor.

## Usage

1. **Select Language**: Choose your target Tamazight language (Kabyle, Central Atlas Tamazight, or Tarifit)
2. **Choose Lesson**: Select from available topics (Greetings, Numbers, Family, Food, etc.)
3. **Study Lesson**: Review the AI-generated lesson content with vocabulary and pronunciation
4. **Start Exercise**: Test your knowledge with auto-generated multiple-choice exercises
5. **Listen to Pronunciation**: Click the speaker icon to hear audio pronunciation of vocabulary words

## Configuration

### Changing the LLM Model

Edit [backend/llm.py](backend/llm.py) and modify the `model` parameter in the `generate_lesson()` function:

```python
"model": "your-preferred-model:tag"
```

### Customizing Prompts

All lesson prompt templates are defined in [backend/prompts.py](backend/prompts.py). Modify the `LESSON_PROMPT_BASE` and `LESSON_SPECIFIC_PROMPTS` to customize lesson generation.

### Adjusting Ollama Settings

If Ollama is running on a different host or port, update the `OLLAMA_URL` in [backend/llm.py](backend/llm.py):

```python
OLLAMA_URL = "http://your-host:your-port/api/generate"
```

## Development

### Project Organization

- **[backend/llm.py](backend/llm.py)**: Handles all LLM interactions with Ollama, including JSON response parsing and error handling
- **[backend/main.py](backend/main.py)**: FastAPI application setup, CORS middleware, and all API route definitions
- **[backend/prompts.py](backend/prompts.py)**: Centralized prompt engineering for lesson generation (easily customizable)
- **[backend/tts.py](backend/tts.py)**: Text-to-speech synthesis for pronunciation
- **[frontend/script.js](frontend/script.js)**: Client-side logic, API communication, and UI interactions
- **[frontend/index.html](frontend/index.html)**: Multi-screen UI structure (language selection, lesson list, lesson display, exercises)
- **[frontend/style.css](frontend/style.css)**: Responsive design with mobile support

### Extending the Application

#### Add a New Lesson Topic

1. Add the topic to `LESSON_SPECIFIC_PROMPTS` in [backend/prompts.py](backend/prompts.py)
2. Update the lesson list response in [backend/main.py](backend/main.py)
3. Frontend will automatically display the new topic

#### Swap LLM Providers

Replace Ollama calls in [backend/llm.py](backend/llm.py) with your preferred provider (OpenAI, Anthropic, etc.)

#### Enhance the Frontend

Extend [frontend/script.js](frontend/script.js) and [frontend/index.html](frontend/index.html) to add:
- Lesson progress tracking
- User profiles and preferences
- Spaced repetition scheduling
- Gamification (points, streaks, badges)

## Troubleshooting

### Ollama Connection Error
- Ensure Ollama is running: `ollama serve`
- Check that Ollama is accessible at `http://localhost:11434`
- Verify the `translategemma:12b` model is pulled: `ollama list`

### LLM Response Parsing Issues
- Check [backend/llm.py](backend/llm.py) `extract_json_from_response()` for robust JSON extraction
- Review Ollama logs for model inference errors
- Ensure the model generates valid JSON (see prompts for format requirements)

### Port Already in Use
If port 8000 is occupied, run with a different port:
```bash
python -m uvicorn backend.main:app --port 8001
```

## Future Enhancements

- [ ] User authentication and progress tracking
- [ ] SQLite database for conversation history and performance metrics
- [ ] Spaced repetition system for vocabulary retention
- [ ] Lesson difficulty levels (beginner, intermediate, advanced)
- [ ] User-generated vocabulary lists
- [ ] Mobile app wrapper (React Native/Flutter)
- [ ] Audio input for pronunciation practice
- [ ] Gamification (points, achievements, leaderboards)
- [ ] Export lesson notes and flashcards

## License

This project is open source. Check the repository for license details.

## Support

For questions, issues, or feedback, please open an issue in the repository or contact the maintainers.

---

**Last Updated**: January 19, 2026  
**Status**: Active Development
