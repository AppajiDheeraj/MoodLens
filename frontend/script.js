// --- Configuration ---
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const TIMESLICE_MS = 1000;
const RECONNECT_DELAY_MS = 3000;

// --- DOM Elements (Safely checked) ---
const statusText = document.getElementById("status-text");
const emotionOutput = document.getElementById("emotion-output");
const canvas = document.getElementById("eye-canvas");
const ctx = canvas.getContext("2d");
const startOverlay = document.getElementById('start-overlay');

// --- State Variables ---
let socket;
let mediaRecorder;
let animationFrameId;
let isRunning = false;

// --- Eye State Management ---
const eyeState = {
  defaults: {
    eyeLWidth: 40, eyeLHeight: 40, eyeRWidth: 40, eyeRHeight: 40,
    eyeLx: 0, eyeLy: 0, eyeRx: 0, eyeRy: 0,
    eyelidsAngryHeight: 0, eyelidsHappyBottomOffset: 0, eyelidsSadTopOffset: 0,
    isJoyShape: 0, color: "white", glowColor: "rgba(255, 255, 255, 0.7)", glowBlur: 15,
  },
  current: {},
  next: {},
};

// --- Helper Functions ---
function updateStatus(text) {
    console.log("Status:", text);
    if (statusText) { statusText.textContent = text; }
}

function updateEmotion(text) {
    console.log("Emotion:", text);
    if (emotionOutput) { emotionOutput.textContent = text; }
}

// --- Initialization ---
function initializeEyeState() {
  const container = document.getElementById("eye-container");
  if (!container || !canvas) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  const screenWidth = canvas.width;
  const screenHeight = canvas.height;
  const spaceBetween = 20;

  eyeState.defaults.eyeLWidth = screenWidth * 0.25;
  eyeState.defaults.eyeLHeight = eyeState.defaults.eyeLWidth;
  eyeState.defaults.eyeRWidth = eyeState.defaults.eyeLWidth;
  eyeState.defaults.eyeRHeight = eyeState.defaults.eyeLHeight;

  eyeState.defaults.eyeLx = screenWidth / 2 - eyeState.defaults.eyeLWidth / 2 - spaceBetween / 2;
  eyeState.defaults.eyeLy = screenHeight / 2;
  eyeState.defaults.eyeRx = screenWidth / 2 + eyeState.defaults.eyeRWidth / 2 + spaceBetween / 2;
  eyeState.defaults.eyeRy = screenHeight / 2;

  eyeState.current = { ...eyeState.defaults, eyeLHeight: 2, eyeRHeight: 2, isJoyShape: 0 };
  eyeState.next = { ...eyeState.current };
}

// --- Drawing & Animation ---
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
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = eyeState.current;

  if (s.glowBlur > 0) {
    ctx.shadowColor = s.glowColor;
    ctx.shadowBlur = s.glowBlur;
  }
  ctx.fillStyle = s.color;

  if (s.isJoyShape > 0.5) {
    const width = (s.eyeLWidth + s.eyeRWidth + 20) * 0.9;
    const height = s.eyeLHeight * 0.6;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dip = s.eyelidsHappyBottomOffset;
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, centerY);
    ctx.bezierCurveTo(centerX - width / 2, centerY - height, centerX + width / 2, centerY - height, centerX + width / 2, centerY);
    ctx.bezierCurveTo(centerX + width / 4, centerY + dip, centerX - width / 4, centerY + dip, centerX - width / 2, centerY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(s.eyeLx, s.eyeLy, s.eyeLWidth / 2, s.eyeLHeight / 2, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.eyeRx, s.eyeRy, s.eyeRWidth / 2, s.eyeRHeight / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
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

// --- Emotion State Changers ---
function setEmotion(emotion) {
  const d = eyeState.defaults;
  eyeState.next = { ...d, isJoyShape: 0 };
  switch (emotion) {
    case "anger":
      eyeState.next.color = "#FF4500";
      eyeState.next.glowColor = "#FF4500";
      eyeState.next.eyelidsAngryHeight = d.eyeLHeight * 0.7;
      eyeState.next.eyeLHeight = d.eyeLHeight * 0.8;
      eyeState.next.eyeRHeight = d.eyeRHeight * 0.8;
      break;
    case "joy":
      eyeState.next.isJoyShape = 1;
      eyeState.next.color = "#00FFFF";
      eyeState.next.glowColor = "#00FFFF";
      eyeState.next.glowBlur = 20;
      eyeState.next.eyelidsHappyBottomOffset = d.eyeLHeight * 0.4;
      break;
    case "sadness":
      eyeState.next.color = "#6495ED";
      eyeState.next.glowColor = "#6495ED";
      eyeState.next.eyelidsSadTopOffset = d.eyeLHeight * 0.65;
      break;
    case "fear":
      eyeState.next.color = "#E6E6FA";
      eyeState.next.glowColor = "#E6E6FA";
      eyeState.next.eyeLHeight = d.eyeLHeight * 1.2;
      eyeState.next.eyeRHeight = d.eyeRHeight * 1.2;
      break;
    case "surprise":
      eyeState.next.color = "#FFFFFF";
      eyeState.next.glowColor = "#FFFFFF";
      eyeState.next.eyeLHeight = d.eyeLHeight * 1.1;
      eyeState.next.eyeRHeight = d.eyeRHeight * 1.1;
      break;
    case "disgust":
      eyeState.next.color = "#9ACD32";
      eyeState.next.glowColor = "#9ACD32";
      eyeState.next.eyeLHeight = d.eyeLHeight * 0.5;
      eyeState.next.eyeRHeight = d.eyeRHeight * 0.5;
      break;
    case "neutral":
    default:
      break;
  }
}

function blink() {
  if (eyeState.next.isJoyShape === 1) return;
  const originalState = { ...eyeState.next };
  eyeState.next.eyeLHeight = 2;
  eyeState.next.eyeRHeight = 2;
  eyeState.next.eyelidsAngryHeight = 0;
  eyeState.next.eyelidsSadTopOffset = 0;
  setTimeout(() => { eyeState.next = originalState; }, 150);
}

// --- Main Application Logic ---
async function connectAndListen() {
  if (isRunning) return;
  isRunning = true;
  updateStatus("Initializing microphone...");
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    updateStatus("Connecting to server...");
    const options = { mimeType: "audio/wav" };
    window.MediaRecorder = window.OpusMediaRecorder;
    mediaRecorder = new MediaRecorder(stream, options);
    socket = new WebSocket(BACKEND_URL);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };
    socket.onopen = () => {
      console.log("SUCCESS: WebSocket connection established.");
      updateStatus("Microphone is active. Listening...");
      if (mediaRecorder.state !== "recording") {
        mediaRecorder.start(TIMESLICE_MS);
      }
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.emotion) {
        updateEmotion(data.emotion);
        setEmotion(data.emotion);
      }
    };
    socket.onclose = () => {
      console.log("INFO: WebSocket connection closed. Reconnecting...");
      updateStatus("Connection lost. Reconnecting...");
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      isRunning = false;
      setTimeout(connectAndListen, RECONNECT_DELAY_MS);
    };
    socket.onerror = (error) => {
      console.error("ERROR: WebSocket connection error:", error);
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    };
  } catch (error) {
    console.error("ERROR: Failed to get microphone:", error);
    updateStatus("Microphone access was denied. Please allow access and refresh.");
    isRunning = false;
  }
}

// --- Initial Setup & Start Logic ---
function setup() {
  initializeEyeState();
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animate();
  setInterval(blink, 4000);
  setEmotion("neutral");
}

function startApp() {
    // This is the main entry point for the application logic
    if (startOverlay) {
        startOverlay.addEventListener('click', () => {
            console.log("Start overlay clicked. Initializing audio.");
            startOverlay.style.display = 'none';
            connectAndListen();
        });
    } else {
        // If there's no start overlay, begin immediately.
        console.log("No start overlay found. Initializing audio immediately.");
        connectAndListen();
    }
}

// Run setup as soon as the page loads
window.addEventListener("DOMContentLoaded", () => {
    setup();
    startApp();
});

window.addEventListener("resize", setup);
