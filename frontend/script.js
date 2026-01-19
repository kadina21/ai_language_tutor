const API_BASE_URL = "http://localhost:8000";
let currentLanguage = "";
let currentLessonText = "";
let currentVocabulary = [];
let currentExercise = null;
let currentTopic = "";

// Initialize app
document.addEventListener("DOMContentLoaded", async () => {
  await loadLanguages();
  setupEventListeners();
});

// Load languages from backend
async function loadLanguages() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/languages`);
    const data = await res.json();
    
    const select = document.getElementById("languageSelect");
    select.innerHTML = '<option value="">Select a language...</option>';
    
    data.languages.forEach(lang => {
      const option = document.createElement("option");
      option.value = lang.value;
      option.textContent = lang.label;
      select.appendChild(option);
    });
    
    document.getElementById("instructions").textContent = data.instructions;
    document.getElementById("startBtn").disabled = false;
  } catch (error) {
    console.error("Error loading languages:", error);
    document.getElementById("languageSelect").innerHTML = 
      '<option value="">Error loading languages</option>';
  }
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById("languageSelect").addEventListener("change", (e) => {
    document.getElementById("startBtn").disabled = !e.target.value;
  });
  
  document.getElementById("startBtn").addEventListener("click", () => {
    const selectedLanguage = document.getElementById("languageSelect").value;
    if (selectedLanguage) {
      currentLanguage = selectedLanguage;
      showLessonList();
    }
  });
}

// Show lesson list screen
async function showLessonList() {
  document.getElementById("selectedLanguage").textContent = `Learning ${currentLanguage}`;
  showScreen("lessonListScreen");
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/list`);
    const data = await res.json();
    
    const lessonList = document.getElementById("lessonList");
    lessonList.innerHTML = "";
    
    if (data.lessons && data.lessons.length > 0) {
      data.lessons.forEach(lesson => {
        const lessonCard = document.createElement("div");
        lessonCard.className = "lesson-card";
        lessonCard.innerHTML = `
          <h3>${lesson.title}</h3>
          <p>${lesson.description}</p>
        `;
        lessonCard.addEventListener("click", () => {
          loadLesson(lesson.id, lesson.title);
        });
        lessonList.appendChild(lessonCard);
      });
    } else {
      lessonList.innerHTML = '<div class="error">No lessons available</div>';
    }
  } catch (error) {
    console.error("Error loading lesson list:", error);
    document.getElementById("lessonList").innerHTML = 
      '<div class="error">Error loading lessons. Please try again.</div>';
  }
}

// Load a specific lesson
async function loadLesson(lessonId, topic = "Greetings") {
  showScreen("lessonScreen");
  currentTopic = topic;
  document.getElementById("lessonLanguage").textContent = `Learning ${currentLanguage} - ${topic}`;
  document.getElementById("lessonOutput").innerHTML = '<div class="loading">Generating your lesson...</div>';
  document.getElementById("exerciseBtn").disabled = true;
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/lesson?language=${encodeURIComponent(currentLanguage)}&topic=${encodeURIComponent(topic)}`);
    const data = await res.json();
    
    currentLessonText = data.lesson || "No lesson content available.";
    currentVocabulary = data.vocabulary || [];
    
    // Display lesson with vocabulary section
    let lessonHTML = `<div class="lesson-main">${escapeHtml(currentLessonText)}</div>`;
    
    if (currentVocabulary.length > 0) {
      lessonHTML += `
        <div class="vocabulary-section">
          <h3>Vocabulary</h3>
          <table class="vocabulary-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Translation</th>
                <th>Pronunciation</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
      `;
      currentVocabulary.forEach((word, index) => {
        lessonHTML += `
          <tr>
            <td class="vocab-word">${escapeHtml(word.word)}</td>
            <td class="vocab-translation">${escapeHtml(word.translation)}</td>
            <td class="vocab-pronunciation">${word.pronunciation ? escapeHtml(word.pronunciation) : '-'}</td>
            <td><button class="btn-speak" data-word-index="${index}" title="Pronounce">🔊</button></td>
          </tr>
        `;
      });
      lessonHTML += '</tbody></table></div>';
      
      // Add click handlers after rendering
      setTimeout(() => {
        document.querySelectorAll('.vocabulary-table .btn-speak').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.wordIndex);
            const wordData = currentVocabulary[index];
            if (wordData) {
              speakWord(wordData.word);
            }
          });
        });
      }, 0);
    }
    
    document.getElementById("lessonOutput").innerHTML = lessonHTML;
    document.getElementById("exerciseBtn").disabled = currentVocabulary.length === 0;
  } catch (error) {
    console.error("Error loading lesson:", error);
    document.getElementById("lessonOutput").innerHTML = 
      '<div class="error">Error generating lesson. Please try again.</div>';
    document.getElementById("exerciseBtn").disabled = true;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Escape string for use in JavaScript attribute
function escapeJsString(text) {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Generate a new lesson
function generateNewLesson() {
  loadLesson(null, currentTopic);
}

// Text-to-speech for individual word using Meta's MMS TTS
async function speakWord(word) {
  try {
    console.log(`Requesting TTS for: ${word}`);
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: word,
        language: currentLanguage
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error("TTS error:", data.error);
      // Fallback to browser TTS
      fallbackSpeech(word);
      return;
    }
    
    console.log("Audio received, converting and playing...");
    
    // Decode base64 to ArrayBuffer
    const binaryString = atob(data.audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create a blob from the bytes
    const blob = new Blob([bytes], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(blob);
    
    console.log("Audio blob created, URL:", audioUrl);
    
    // Create and play audio
    const audio = new Audio(audioUrl);
    
    audio.onplay = () => console.log("Audio playback started");
    audio.onended = () => {
      console.log("Audio playback ended");
      URL.revokeObjectURL(audioUrl); // Clean up
    };
    audio.onerror = (e) => {
      console.error("Audio playback error:", e);
      fallbackSpeech(word);
    };
    
    audio.play().catch((error) => {
      console.error("Could not play audio:", error);
      fallbackSpeech(word);
    });
  } catch (error) {
    console.error("TTS request failed:", error);
    fallbackSpeech(word); // Use browser TTS as fallback
  }
}

// Fallback to browser's Web Speech API
function fallbackSpeech(word) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "ar-MA";
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

// Start exercise
async function startExercise() {
  if (currentVocabulary.length === 0) {
    alert("No vocabulary available for exercise.");
    return;
  }
  
  showScreen("exerciseScreen");
  document.getElementById("exerciseLanguage").textContent = `${currentLanguage} - ${currentTopic} Exercise`;
  document.getElementById("exerciseQuestions").innerHTML = '<div class="loading">Generating exercise...</div>';
  document.getElementById("exerciseResults").style.display = "none";
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/exercise`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: currentLanguage,
        vocabulary: currentVocabulary
      })
    });
    const data = await res.json();
    
    currentExercise = data;
    document.getElementById("exerciseInstructions").textContent = data.instructions || "Match each word with its correct translation.";
    
    renderExerciseQuestions(data.questions || []);
  } catch (error) {
    console.error("Error generating exercise:", error);
    document.getElementById("exerciseQuestions").innerHTML = 
      '<div class="error">Error generating exercise. Please try again.</div>';
  }
}

// Render exercise questions
function renderExerciseQuestions(questions) {
  const container = document.getElementById("exerciseQuestions");
  container.innerHTML = "";
  
  if (questions.length === 0) {
    container.innerHTML = '<div class="error">No questions available.</div>';
    return;
  }
  
  questions.forEach((q, qIndex) => {
    const questionDiv = document.createElement("div");
    questionDiv.className = "exercise-question";
    questionDiv.dataset.questionId = q.id;
    questionDiv.dataset.correctAnswer = q.correct_answer;
    questionDiv.dataset.questionIndex = qIndex;
    
    // Shuffle options and filter out any invalid ones
    const validOptions = q.options.filter(opt => opt && !opt.startsWith('unknown_'));
    const shuffledOptions = [...validOptions].sort(() => Math.random() - 0.5);
    
    // Create question header
    const headerDiv = document.createElement("div");
    headerDiv.className = "question-header";
    
    const wordSpan = document.createElement("span");
    wordSpan.className = "question-word";
    wordSpan.textContent = q.word;
    headerDiv.appendChild(wordSpan);
    
    const speakBtn = document.createElement("button");
    speakBtn.className = "btn-speak";
    speakBtn.title = `Pronounce in ${currentLanguage}`;
    speakBtn.textContent = "🔊";
    speakBtn.dataset.word = q.word;
    speakBtn.addEventListener("click", () => speakWord(q.word));
    headerDiv.appendChild(speakBtn);
    
    if (q.pronunciation) {
      const pronSpan = document.createElement("span");
      pronSpan.className = "question-pronunciation";
      pronSpan.textContent = `[${q.pronunciation}]`;
      headerDiv.appendChild(pronSpan);
    }
    
    questionDiv.appendChild(headerDiv);
    
    // Create options as radio buttons
    const optionsDiv = document.createElement("div");
    optionsDiv.className = "options-list";
    
    shuffledOptions.forEach((option, optIndex) => {
      const optionLabel = document.createElement("label");
      optionLabel.className = "option-label";
      
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `question-${q.id}`;
      radio.value = option;
      radio.className = "option-radio";
      radio.addEventListener("change", () => {
        questionDiv.dataset.selectedAnswer = option;
        // Update visual state
        optionsDiv.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('selected'));
        optionLabel.classList.add('selected');
      });
      
      const optionText = document.createElement("span");
      optionText.className = "option-text";
      optionText.textContent = option;
      
      optionLabel.appendChild(radio);
      optionLabel.appendChild(optionText);
      optionsDiv.appendChild(optionLabel);
    });
    
    questionDiv.appendChild(optionsDiv);
    container.appendChild(questionDiv);
  });
  
  // Add submit button
  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary submit-exercise-btn";
  submitBtn.textContent = "Check Answers";
  submitBtn.onclick = checkAnswers;
  container.appendChild(submitBtn);
}

// Check all answers
function checkAnswers() {
  const questions = document.querySelectorAll('.exercise-question');
  let correct = 0;
  let total = questions.length;
  
  questions.forEach(questionDiv => {
    const correctAnswer = questionDiv.dataset.correctAnswer;
    const selectedAnswer = questionDiv.dataset.selectedAnswer;
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Find all option labels and mark correct/incorrect
    questionDiv.querySelectorAll('.option-label').forEach(label => {
      const radio = label.querySelector('.option-radio');
      const optionValue = radio.value;
      const optionText = label.querySelector('.option-text');
      
      if (optionValue === correctAnswer) {
        label.classList.add('correct');
        // Add green checkmark to correct answer
        optionText.innerHTML = `<span style="color: #27ae60; font-weight: bold;">✓</span> ${escapeHtml(optionValue)}`;
      }
      if (radio.checked && optionValue !== correctAnswer) {
        label.classList.add('incorrect');
        // Add red X to incorrect selection
        optionText.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">✗</span> ${escapeHtml(optionValue)}`;
      }
      
      // Disable radio
      radio.disabled = true;
    });
    
    // Add feedback message below the options
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = "answer-feedback";
    
    if (isCorrect) {
      correct++;
      questionDiv.classList.add('answered-correct');
      feedbackDiv.classList.add('feedback-correct');
      feedbackDiv.innerHTML = `<span style="color: #27ae60; font-weight: bold;">✓</span> Correct!`;
    } else {
      questionDiv.classList.add('answered-incorrect');
      feedbackDiv.classList.add('feedback-incorrect');
      if (selectedAnswer) {
        feedbackDiv.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">✗</span> Incorrect. The correct answer is: <strong style="color: #27ae60;">${escapeHtml(correctAnswer)}</strong>`;
      } else {
        feedbackDiv.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">−</span> No answer selected. The correct answer is: <strong style="color: #27ae60;">${escapeHtml(correctAnswer)}</strong>`;
      }
    }
    
    questionDiv.appendChild(feedbackDiv);
  });
  
  // Show results
  const resultsDiv = document.getElementById("exerciseResults");
  const scoreText = document.getElementById("scoreText");
  scoreText.textContent = `You got ${correct} out of ${total} correct! (${Math.round(correct/total * 100)}%)`;
  resultsDiv.style.display = "block";
  
  // Hide submit button
  document.querySelector('.submit-exercise-btn').style.display = 'none';
}

// Retry exercise
function retryExercise() {
  if (currentExercise && currentExercise.questions) {
    document.getElementById("exerciseResults").style.display = "none";
    renderExerciseQuestions(currentExercise.questions);
  }
}

// Go back to lesson from exercise
function goBackToLesson() {
  showScreen("lessonScreen");
}

// Navigation functions
function goBackToLanguage() {
  showScreen("languageScreen");
  currentLanguage = "";
}

function goBackToList() {
  showLessonList();
}

// Screen management
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}
