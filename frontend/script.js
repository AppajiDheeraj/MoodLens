// --- Configuration ---
const AUDIO_BACKEND_URL = "wss://dheeraj06-moodlens.hf.space/ws/audio";
const TEXT_BACKEND_URL = "wss://dheeraj06-moodlens.hf.space/ws/text";
const RECONNECT_DELAY_MS = 3000;
const TIMESLICE_MS = 1000; // For microphone

// --- DOM Elements ---
const canvas = document.getElementById("eye-canvas");
const ctx = canvas.getContext("2d");
const chatIcon = document.getElementById("chat-icon");
const chatWindow = document.getElementById("chat-window");
const closeChatBtn = document.getElementById("close-chat-btn");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatMessages = document.getElementById("chat-messages");

// --- State Variables ---
let audioSocket, textSocket;
let mediaRecorder;
let animationFrameId;
let isMicRunning = false;

// --- Eye State (Unchanged) ---
const eyeState = {
  defaults: { eyeLWidth: 40, eyeLHeight: 40, eyeRWidth: 40, eyeRHeight: 40, eyeLBorderRadius: 12, eyeRBorderRadius: 12, eyeLx: 0, eyeLy: 0, eyeRx: 0, eyeRy: 0, eyelidsAngryHeight: 0, eyelidsHappyBottomOffset: 0, eyelidsSadTopOffset: 0, color: "white" },
  current: {},
  next: {},
};

// --- Initialization and Drawing (Largely Unchanged) ---
function initializeEyeState() {
  const container = document.getElementById("eye-container");
  const screenWidth = container.clientWidth;
  const screenHeight = container.clientHeight;
  const spaceBetween = 20;
  eyeState.defaults.eyeLWidth = screenWidth * 0.25;
  eyeState.defaults.eyeLHeight = eyeState.defaults.eyeLWidth * 0.8;
  eyeState.defaults.eyeRWidth = eyeState.defaults.eyeLWidth;
  eyeState.defaults.eyeRHeight = eyeState.defaults.eyeLHeight;
  eyeState.defaults.eyeLx = screenWidth / 2 - eyeState.defaults.eyeLWidth / 2 - spaceBetween / 2;
  eyeState.defaults.eyeLy = screenHeight / 2;
  eyeState.defaults.eyeRx = screenWidth / 2 + eyeState.defaults.eyeRWidth / 2 + spaceBetween / 2;
  eyeState.defaults.eyeRy = screenHeight / 2;
  eyeState.current = { ...eyeState.defaults, eyeLHeight: 2, eyeRHeight: 2, eyeLBorderRadius: 2, eyeRBorderRadius: 2 };
  eyeState.next = { ...eyeState.current };
}

function animate() {
  for (const key in eyeState.next) {
    if (typeof eyeState.current[key] === "number") {
      eyeState.current[key] += (eyeState.next[key] - eyeState.current[key]) * 0.15;
    } else {
      eyeState.current[key] = eyeState.next[key];
    }
  }
  drawScene();
  animationFrameId = requestAnimationFrame(animate);
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = eyeState.current;
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.ellipse(s.eyeLx, s.eyeLy, s.eyeLWidth / 2, s.eyeLHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s.eyeRx, s.eyeRy, s.eyeRWidth / 2, s.eyeRHeight / 2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "#000";
    if (s.eyelidsAngryHeight > 1) {
        ctx.beginPath();
        ctx.moveTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
        ctx.lineTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
        ctx.lineTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 + s.eyelidsAngryHeight);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
        ctx.lineTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
        ctx.lineTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 + s.eyelidsAngryHeight);
        ctx.closePath();
        ctx.fill();
    }
    if (s.eyelidsHappyBottomOffset > 1) {
        const offset = s.eyelidsHappyBottomOffset;
        ctx.beginPath();
        ctx.moveTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy + s.eyeLHeight / 2);
        ctx.lineTo(s.eyeLx, s.eyeLy + s.eyeLHeight / 2 - offset);
        ctx.lineTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy + s.eyeLHeight / 2);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy + s.eyeRHeight / 2);
        ctx.lineTo(s.eyeRx, s.eyeRy + s.eyeRHeight / 2 - offset);
        ctx.lineTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy + s.eyeRHeight / 2);
        ctx.closePath();
        ctx.fill();
    }
    if (s.eyelidsSadTopOffset > 1) {
        ctx.beginPath();
        ctx.moveTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
        ctx.lineTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
        ctx.lineTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 + s.eyelidsSadTopOffset);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
        ctx.lineTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
        ctx.lineTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 + s.eyelidsSadTopOffset);
        ctx.closePath();
        ctx.fill();
    }
}

function setEmotion(emotion) {
    const d = eyeState.defaults;
    eyeState.next = { ...d };
    switch (emotion) {
        case "anger":
            eyeState.next.color = "#FF4500";
            eyeState.next.eyeLHeight = d.eyeLHeight * 0.8;
            eyeState.next.eyeRHeight = d.eyeRHeight * 0.8;
            eyeState.next.eyelidsAngryHeight = d.eyeLHeight * 0.55;
            break;
        case "joy":
            eyeState.next.eyeLHeight = d.eyeLHeight * 0.6;
            eyeState.next.eyeRHeight = d.eyeRHeight * 0.6;
            eyeState.next.eyelidsHappyBottomOffset = d.eyeLHeight * 0.5;
            break;
        case "sadness":
            eyeState.next.eyelidsSadTopOffset = Math.max(d.eyeLHeight, d.eyeRHeight) * 0.65;
            break;
        case "fear":
            eyeState.next.eyeLHeight = d.eyeLHeight * 1.4;
            eyeState.next.eyeRHeight = d.eyeRHeight * 1.4;
            eyeState.next.eyeLWidth = d.eyeLWidth * 1.3;
            eyeState.next.eyeRWidth = d.eyeRWidth * 1.3;
            break;
        case "surprise":
            eyeState.next.eyeLWidth = d.eyeLWidth * 1.1;
            eyeState.next.eyeRWidth = d.eyeRWidth * 1.1;
            eyeState.next.eyeLHeight = d.eyeLHeight * 1.1;
            eyeState.next.eyeRHeight = d.eyeRHeight * 1.1;
            break;
        case "disgust":
            eyeState.next.eyeLHeight = d.eyeLHeight * 0.5;
            eyeState.next.eyeRHeight = d.eyeRHeight * 0.5;
            break;
        case "neutral":
        default:
            break;
    }
}

function blink() {
  const originalHeightL = eyeState.next.eyeLHeight;
  const originalHeightR = eyeState.next.eyeRHeight;
  eyeState.next.eyeLHeight = 2;
  eyeState.next.eyeRHeight = 2;
  setTimeout(() => {
    eyeState.next.eyeLHeight = originalHeightL;
    eyeState.next.eyeRHeight = originalHeightR;
  }, 150);
}

// --- WebSocket and Microphone Logic ---
async function connectAndListenAudio() {
  if (isMicRunning) return;
  isMicRunning = true;
  console.log("Initializing microphone...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("Connecting to audio server...");
    
    window.MediaRecorder = window.OpusMediaRecorder;
    mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/opus" });
    audioSocket = new WebSocket(AUDIO_BACKEND_URL);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && audioSocket && audioSocket.readyState === WebSocket.OPEN) {
        audioSocket.send(event.data);
      }
    };

    audioSocket.onopen = () => {
      console.log("SUCCESS: Audio WebSocket connected.");
      if (mediaRecorder.state !== "recording") {
        mediaRecorder.start(TIMESLICE_MS);
      }
    };

    audioSocket.onmessage = handleEmotionMessage; // Use shared handler

    audioSocket.onclose = () => {
      console.log("INFO: Audio WebSocket closed. Reconnecting...");
      if (mediaRecorder && mediaRecorder.state === "recording") mediaRecorder.stop();
      isMicRunning = false;
      setTimeout(connectAndListenAudio, RECONNECT_DELAY_MS);
    };

    audioSocket.onerror = (error) => console.error("ERROR: Audio WebSocket error:", error);

  } catch (error) {
    console.error("ERROR: Failed to get microphone:", error);
    alert("Microphone access was denied. Voice control will not work.");
    isMicRunning = false;
  }
}

function connectText() {
    console.log("Connecting to text server...");
    textSocket = new WebSocket(TEXT_BACKEND_URL);

    textSocket.onopen = () => console.log("SUCCESS: Text WebSocket connected.");
    textSocket.onmessage = handleEmotionMessage; // Use shared handler
    textSocket.onclose = () => {
        console.log("INFO: Text WebSocket closed. Reconnecting...");
        setTimeout(connectText, RECONNECT_DELAY_MS);
    };
    textSocket.onerror = (error) => console.error("ERROR: Text WebSocket error:", error);
}

// --- Shared Message Handler ---
function handleEmotionMessage(event) {
    const data = JSON.parse(event.data);
    if (data.emotion) {
        console.log(`Emotion received: ${data.emotion} (from text: "${data.text}")`);
        setEmotion(data.emotion);
        // Add a "bot" response to the chat window if it's open
        if (!chatWindow.classList.contains('hidden')) {
            addMessage(`I sense you're feeling **${data.emotion}**.`, 'bot-message');
        }
    }
}

// --- Chat UI Logic ---
function addMessage(text, senderClass) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', senderClass);
    messageElement.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Basic markdown for bold
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
}

function handleSendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText && textSocket && textSocket.readyState === WebSocket.OPEN) {
        addMessage(messageText, 'user-message');
        textSocket.send(messageText);
        chatInput.value = '';
    }
}

chatIcon.addEventListener('click', () => chatWindow.classList.remove('hidden'));
closeChatBtn.addEventListener('click', () => chatWindow.classList.add('hidden'));
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSendMessage();
});

// --- Initial Setup ---
function setup() {
  const container = document.getElementById("eye-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  initializeEyeState();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animate();
  setInterval(blink, 4000);
  setEmotion("neutral");
}

// --- Autostart ---
window.addEventListener("resize", setup);
(() => {
  setup();
  connectAndListenAudio(); // Start listening for voice
  connectText(); // Start connection for text chat
})();
