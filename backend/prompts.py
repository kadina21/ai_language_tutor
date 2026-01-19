# Base template for lessons
LESSON_PROMPT_BASE = """
You are a Tamazight language teacher, specifically for the {language} language.

{specific_instructions}

IMPORTANT: You must respond in valid JSON format with the following structure:
{{
  "lesson_text": "The full lesson content as a string with newlines for formatting",
  "vocabulary": [
    {{"word": "word in {language}", "translation": "English translation", "pronunciation": "phonetic pronunciation guide"}},
    ...
  ]
}}

The vocabulary array should contain all the words from the lesson with their translations and pronunciation guides.

Respond ONLY with the JSON, no additional text.
"""

# Specific instructions for each lesson type
LESSON_SPECIFIC_PROMPTS = {
    "Greetings": """
Create a beginner lesson about greetings and basic expressions in {language}.

Include these 5 essential greetings:
1. Hello / Hi (informal greeting)
2. Good morning
3. Good evening
4. How are you?
5. Goodbye

For each greeting, provide:
- The word/phrase in {language}
- English translation
- A phonetic pronunciation guide

Also include 1-2 simple example dialogues using these greetings.
""",

    "Numbers": """
Create a beginner lesson about numbers in {language}.

Include ALL numbers from 1 to 10:
1. One (1)
2. Two (2)
3. Three (3)
4. Four (4)
5. Five (5)
6. Six (6)
7. Seven (7)
8. Eight (8)
9. Nine (9)
10. Ten (10)

For each number, provide:
- The number word in {language}
- English translation (the number)
- A phonetic pronunciation guide

Also include 1-2 simple example sentences using numbers (e.g., "I have three books").
""",

    "Family": """
Create a beginner lesson about family members in {language}.

Include these 6 essential family terms:
1. Mother
2. Father
3. Brother
4. Sister
5. Grandmother
6. Grandfather

For each family member, provide:
- The word in {language}
- English translation
- A phonetic pronunciation guide

Also include 1-2 simple example sentences about family (e.g., "This is my mother").
""",

    "Food": """
Create a beginner lesson about common foods in {language}.

Include these 5-6 common food items:
1. Bread
2. Water
3. Meat
4. Vegetables / Fruits
5. Tea or Coffee
6. Couscous (traditional dish)

For each food item, provide:
- The word in {language}
- English translation
- A phonetic pronunciation guide

Also include 1-2 simple phrases for ordering or asking for food (e.g., "I would like water please", "Is this good?").
""",

    "Simple Sentences": """
Create a beginner lesson about constructing simple sentences in {language}.

Include these 5-6 useful basic phrases:
1. Yes
2. No
3. Please
4. Thank you
5. I don't understand
6. What is this?

For each phrase, provide:
- The phrase in {language}
- English translation
- A phonetic pronunciation guide

Also include 2-3 example sentences showing basic sentence structure (subject + verb + object).
"""
}

# Default/fallback prompt for unknown topics
DEFAULT_LESSON_PROMPT = """
Create a short beginner lesson about "{topic}" for {language}.

Include:
- 5-6 basic words related to {topic}
- 1-2 simple sentences using those words
- English translation for each word and sentence

For each word, provide a phonetic pronunciation guide.
"""

EXERCISE_PROMPT_TEMPLATE = """
You are a Tamazight language teacher creating an exercise for {language}.

Based on these vocabulary words:
{vocabulary_json}

Create a matching exercise where the student must match {language} words to their ENGLISH translations.

IMPORTANT RULES:
1. The "options" array must ONLY contain ENGLISH words/phrases, NEVER {language} words
2. The correct_answer must be the English translation from the vocabulary
3. The wrong options must be plausible but incorrect English translations (other English words related to the topic)
4. Each question should have exactly 4 options (1 correct + 3 wrong)

You must respond in valid JSON format with the following structure:
{{
  "exercise_type": "matching",
  "instructions": "Match each {language} word with its correct English translation",
  "questions": [
    {{
      "id": 1,
      "word": "word in {language}",
      "pronunciation": "phonetic guide",
      "correct_answer": "English translation",
      "options": ["English option 1", "English option 2", "English option 3", "English option 4"]
    }},
    ...
  ]
}}

Create one question for each vocabulary word. Shuffle the options array so the correct answer is not always first.
Respond ONLY with the JSON, no additional text.
"""


def get_lesson_prompt(language: str, topic: str) -> str:
    """Generate a lesson prompt for the given language and topic.
    
    Uses specific prompts for known lesson types, falls back to default for unknown topics.
    """
    # Get the specific instructions for this topic, or use the default
    if topic in LESSON_SPECIFIC_PROMPTS:
        specific_instructions = LESSON_SPECIFIC_PROMPTS[topic].format(language=language)
    else:
        specific_instructions = DEFAULT_LESSON_PROMPT.format(language=language, topic=topic)
    
    return LESSON_PROMPT_BASE.format(language=language, specific_instructions=specific_instructions)


def get_exercise_prompt(language: str, vocabulary: list) -> str:
    """Generate an exercise prompt based on vocabulary words."""
    import json
    vocabulary_json = json.dumps(vocabulary, indent=2)
    return EXERCISE_PROMPT_TEMPLATE.format(language=language, vocabulary_json=vocabulary_json)
