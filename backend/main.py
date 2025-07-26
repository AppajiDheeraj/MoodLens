# backend/main.py

import asyncio
import io
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import speech_recognition as sr
from transformers import pipeline
import soundfile as sf
import numpy as np

# --- Initialize App & Model ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

@app.get("/")
def read_root():
    return {"status": "Backend is running successfully"}

print("Loading emotion recognition model...")
emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
print("Model loaded successfully.")

recognizer = sr.Recognizer()
# We need to know the sample rate the browser will send. 48kHz is standard.
SAMPLE_RATE = 48000
SAMPLE_WIDTH = 2  # 16-bit audio

# --- WebSocket Endpoint ---
@app.websocket("/ws/audio")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection established.")
    
    # This buffer will accumulate audio data from the client
    audio_buffer = bytearray()
    
    try:
        while True:
            # Receive raw audio bytes from the client
            data = await websocket.receive_bytes()
            audio_buffer.extend(data)

            # We need enough data to form a coherent phrase. Let's process every ~2 seconds of audio.
            # 2 seconds * 48000 samples/sec * 2 bytes/sample = 192000 bytes
            if len(audio_buffer) > 192000:
                # Create a copy for processing, and clear the main buffer for new audio
                processing_buffer = audio_buffer
                audio_buffer = bytearray()

                try:
                    # Convert the raw bytes to a numpy array
                    audio_np = np.frombuffer(processing_buffer, dtype=np.int16)

                    # Convert to WAV in memory for SpeechRecognition
                    wav_io = io.BytesIO()
                    sf.write(wav_io, audio_np, SAMPLE_RATE, format='WAV')
                    wav_io.seek(0)

                    # Transcribe
                    with sr.AudioFile(wav_io) as source:
                        audio_data = recognizer.record(source)
                    
                    text = recognizer.recognize_google(audio_data)
                    print(f"Transcribed: \"{text}\"")

                    # Analyze emotion
                    results = emotion_classifier(text)
                    dominant_emotion = max(results[0], key=lambda x: x['score'])['label']
                    print(f"Emotion: {dominant_emotion}")

                    # Send result back to client immediately
                    await websocket.send_json({"emotion": dominant_emotion, "text": text})

                except sr.UnknownValueError:
                    # This is common, just means a pause in speech. Ignore and continue.
                    pass
                except Exception as e:
                    print(f"Error during processing: {e}")

    except WebSocketDisconnect:
        print("WebSocket connection closed.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# # --- Main entry point to run the server with Uvicorn ---
# if __name__ == "__main__":
#     print("Starting server with Uvicorn...")
#     # The string "main:app" tells Uvicorn to look for the 'app' object in the 'main' module.
#     # reload=True is very helpful for development, as it restarts the server on code changes.
#     uvicorn.run("main:app", host="127.0.0.1", port=5000, reload=True)
