import torch
from transformers import pipeline
import base64
import io
import numpy as np
from scipy.io import wavfile

# Initialize TTS models for different Tamazight dialects
# Using Meta's MMS TTS models
MODELS = {}

# Map language names to MMS model IDs
LANGUAGE_MODELS = {
    "Central Atlas Tamazight": "facebook/mms-tts-shi",    # Tachelhit
    "Kabyle": "facebook/mms-tts-kab",                      # Taqbaylit
    "Tachelhit": "facebook/mms-tts-shi",                   # Tachelhit
    "Tarifit": "facebook/mms-tts-rif",                     # Tarifit
    "Tamasheq": "facebook/mms-tts-taq",                    # Tamasheq
}


def get_tts_model(language: str):
    """Get or load the TTS model for a given language."""
    model_id = LANGUAGE_MODELS.get(language, "facebook/mms-tts-shi")
    
    if model_id not in MODELS:
        try:
            print(f"Loading TTS model: {model_id}...")
            MODELS[model_id] = pipeline("text-to-speech", model=model_id)
            print(f"✓ Successfully loaded {model_id}")
        except Exception as e:
            print(f"Error loading model {model_id}: {e}")
            return None
    
    return MODELS[model_id]


def synthesize_speech(text: str, language: str = "Central Atlas Tamazight") -> dict:
    """
    Convert Tamazight text to speech using Meta's MMS TTS model.
    
    Args:
        text: The text to synthesize (in Tamazight)
        language: The Tamazight dialect name
    
    Returns:
        dict with 'audio' (base64 encoded) or 'error' key
    """
    if not text or not text.strip():
        return {"error": "No text provided"}
    
    try:
        # Get the appropriate model
        tts_pipeline = get_tts_model(language)
        if not tts_pipeline:
            return {"error": "TTS model not available"}
        
        # Generate speech
        print(f"Synthesizing speech for: {text}")
        output = tts_pipeline(text)
        
        # Extract audio data and sample rate
        audio_array = np.array(output["audio"]).astype(np.float32)
        sample_rate = output["sampling_rate"]
        
        # Flatten if multi-dimensional (take first channel if stereo)
        if audio_array.ndim > 1:
            audio_array = audio_array[0] if audio_array.shape[0] < audio_array.shape[1] else audio_array[:, 0]
        
        # Normalize audio to [-1, 1] range
        max_val = np.max(np.abs(audio_array))
        if max_val > 0:
            audio_array = audio_array / max_val
        
        # Convert to int16 for WAV format
        audio_int16 = np.clip(audio_array * 32767, -32768, 32767).astype(np.int16)
        
        # Save to bytes buffer in WAV format
        audio_buffer = io.BytesIO()
        wavfile.write(audio_buffer, sample_rate, audio_int16)
        audio_buffer.seek(0)
        
        # Encode as base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        
        print(f"Audio encoded successfully. Base64 length: {len(audio_base64)}")
        
        return {
            "audio": audio_base64,
            "format": "wav",
            "sample_rate": sample_rate
        }
    except Exception as e:
        print(f"Error synthesizing speech: {e}")
        return {"error": f"TTS synthesis failed: {str(e)}"}
