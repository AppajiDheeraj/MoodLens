# 🎙️ MoodLens – Real-Time Voice Emotion Visualizer

**Turn voice into emotion. Visualized through expressive animated eyes.**

---

## 📌 Project Description

**MoodLens** is an interactive, full-stack web application that analyzes human emotions from live voice input in real-time and visually represents them using dynamically animated eyes. It bridges the gap between natural language processing and intuitive design — transforming speech into sentiment and sentiment into expressive visuals.

Whether you're building emotionally aware interfaces or just exploring human-AI interaction, MoodLens offers an engaging experience combining voice, AI, and animation.

---

## 🎯 Key Features

- 🎤 **Live Voice Input** – Capture real-time audio via browser microphone
- 🧠 **Emotion Detection** – Analyze emotions from transcribed text using a state-of-the-art transformer model
- 👁️ **Dynamic Visual Feedback** – Display emotional states (e.g., happy, sad, angry) through eye expressions
- 🔁 **Real-Time Streaming** – Low-latency interaction using WebSockets
- 💬 **Text Transcription** – Display transcribed speech and detected emotion live on screen
- 🔒 **Privacy-Focused** – No cloud storage or audio saving; all data processed in memory

---

## 🛠️ Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| **Frontend** | HTML, CSS, JavaScript (Canvas API, Web Audio API) |
| **Backend**  | Python, FastAPI, WebSockets, SpeechRecognition     |
| **ML Model** | Hugging Face Transformers (DistilRoBERTa - Emotion)|
| **Audio**    | MediaRecorder API, SoundFile, Opus codec           |

---

## 🧪 Supported Emotions

- 😊 **Happy**
- 😢 **Sad**
- 😠 **Angry**
- 😱 **Surprise**
- 😨 **Fear**
- 😒 **Disgust**
- 😐 **Neutral**

---

## 🗂️ Folder Structure



---

## 🚀 Getting Started

### ✅ Prerequisites

- Python 3.8+
- A modern browser (Chrome, Edge, Firefox)
- Internet connection (for model download on first run)

---

### 🔧 Backend Setup

# 1. Clone the repository
```bash
git clone https://github.com/your-username/MoodLens.git
cd MoodLens/backend
```

# 2. Create a virtual environment
```bash
python -m venv venv
source venv/bin/activate  # For Windows: venv\Scripts\activate
```

# 3. Install dependencies
```bash
pip install -r requirements.txt
```

# 4. Start the backend server
```bash
uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```


## 🌐 Frontend Setup

1. Open `frontend/index.html` in a browser  
2. Allow microphone access when prompted  
3. Start speaking and watch the eyes react in real-time 🎭

---

## 📸 Screenshots

> *(Include 2–3 GIFs or static images demonstrating:)*  
- 🎤 Live audio input  
- 👀 Eye expressions for different emotions  
- ✍️ Real-time transcription

---

## 🧠 Emotion Model

- **Model:** [`j-hartmann/emotion-english-distilroberta-base`](https://huggingface.co/j-hartmann/emotion-english-distilroberta-base)  
- **Framework:** 🤗 Hugging Face Transformers  
- **Description:** A fine-tuned DistilRoBERTa model capable of detecting nuanced emotional cues in English text.

---

## 🛡️ Data Privacy

- No voice data is stored or shared  
- All emotion detection and transcription are handled locally in-memory  
- You are always in full control of your data  

---

## 📈 Future Improvements

- 🎯 Support multilingual emotion detection  
- 👄 Add mouth and eyebrow animations for richer facial expressions  
- 📱 Convert the app into a Progressive Web App (PWA)  
- 📊 Visualize emotion trends via sentiment graphs and analytics  
- 🔊 Add voice feedback or AI-generated audio responses  

---

## 🤝 Contributing

Contributions are welcome!  
To get started:

```bash
1. Fork this repository  
2. Create a new branch (`git checkout -b feature-name`)  
3. Commit your changes  
4. Push to your branch  
5. Open a Pull Request
```

---

## 👨‍💻 Author
Appaji Dheeraj
🧑‍🎓 NITK Surathkal | AI & Creative Tech Enthusiast

---
<p align="center" >
  Made with ❤️ and a lot of ☕ by [Dheeraj Appaji](https://github.com/AppajiDheeraj)
</p>
