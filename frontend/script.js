
// --- Configuration ---
const BACKEND_URL = "wss://dheeraj06-moodlens.hf.space/ws/audio";
const TIMESLICE_MS = 1000;

// --- DOM Elements (Now safely checked) ---
const statusText = document.getElementById("status-text");
const emotionOutput = document.getElementById("emotion-output");
const canvas = document.getElementById("eye-canvas");
const ctx = canvas.getContext("2d");

// --- State Variables ---
let socket;
let mediaRecorder;
let animationFrameId;
let isRunning = false;

// --- Eye State Management (Inspired by FluxGarage_RoboEyes.h) ---
// We store the 'current' state and the 'next' (target) state.
// The animation loop will smoothly interpolate between them.
const eyeState = {
  // Default/Reference values
  defaults: {
    eyeLWidth: 40,
    eyeLHeight: 40,
    eyeRWidth: 40,
    eyeRHeight: 40,
    eyeLBorderRadius: 12,
    eyeRBorderRadius: 12,
    eyeLx: 0,
    eyeLy: 0,
    eyeRx: 0,
    eyeRy: 0,
    eyelidsAngryHeight: 0,
    eyelidsHappyBottomOffset: 0,
    eyelidsSadTopOffset: 0,
    color: "white",
  },
  // Current animated values
  current: {},
  // Target values for the next state
  next: {},
};

// --- Helper function to safely update text content ---
function updateStatus(text) {
    console.log("Status:", text); // Always log to console for debugging
    if (statusText) { // Only update the HTML if the element exists
        statusText.textContent = text;
    }
}

function updateEmotion(text) {
    console.log("Emotion:", text); // Always log to console
    if (emotionOutput) { // Only update the HTML if the element exists
        emotionOutput.textContent = text;
    }
}

// --- Initialization ---
function initializeEyeState() {
  const container = document.getElementById("eye-container");
  const screenWidth = container.clientWidth;
  const screenHeight = container.clientHeight;
  const spaceBetween = 20;

  eyeState.defaults.eyeLWidth = screenWidth * 0.25;
  eyeState.defaults.eyeLHeight = eyeState.defaults.eyeLWidth*0.8;
  eyeState.defaults.eyeRWidth = eyeState.defaults.eyeLWidth;
  eyeState.defaults.eyeRHeight = eyeState.defaults.eyeLHeight;

  eyeState.defaults.eyeLx =
    screenWidth / 2 - eyeState.defaults.eyeLWidth / 2 - spaceBetween / 2;
  eyeState.defaults.eyeLy = screenHeight / 2;
  eyeState.defaults.eyeRx =
    screenWidth / 2 + eyeState.defaults.eyeRWidth / 2 + spaceBetween / 2;
  eyeState.defaults.eyeRy = screenHeight / 2;

  // Set initial current and next states to a closed eye
  eyeState.current = {
    ...eyeState.defaults,
    eyeLHeight: 2,
    eyeRHeight: 2,
    eyeLBorderRadius: 2,
    eyeRBorderRadius: 2,
  };
  eyeState.next = { ...eyeState.current };
}

// --- Main Drawing & Animation Loop ---
function animate() {
  // Tweening logic: smoothly move current values towards next values
  for (const key in eyeState.next) {
    if (typeof eyeState.current[key] === "number") {
      eyeState.current[key] +=
        (eyeState.next[key] - eyeState.current[key]) * 0.15;
    } else {
      eyeState.current[key] = eyeState.next[key]; // for non-numeric values like color
    }
  }

  drawScene();
  animationFrameId = requestAnimationFrame(animate);
}

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const s = eyeState.current; // shorthand for current state

  // --- Draw Main Eye Shapes ---
  // This is similar to display.fillRoundRect in the C++ code
  ctx.fillStyle = s.color;
  // Left Eye (Ellipse)
  ctx.beginPath();
  ctx.ellipse(
    s.eyeLx, // center x
    s.eyeLy, // center y
    s.eyeLWidth / 2, // radius x
    s.eyeLHeight / 2, // radius y
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();

  // Right Eye (Ellipse)
  ctx.beginPath();
  ctx.ellipse(
    s.eyeRx,
    s.eyeRy,
    s.eyeRWidth / 2,
    s.eyeRHeight / 2,
    0,
    0,
    2 * Math.PI
  );
  ctx.fill();

  // --- Draw Eyelids (Overlays) ---
  // This logic mimics using display.fillTriangle and fillRoundRect with BGCOLOR
  // to "cut out" parts of the main eye shape.
  ctx.fillStyle = "#000"; // Use black to overlay and create new shapes

  // Angry Eyelids
  if (s.eyelidsAngryHeight > 1) {
    // Left Eye
    ctx.beginPath();
    ctx.moveTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
    ctx.lineTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2);
    ctx.lineTo(
      s.eyeLx + s.eyeLWidth / 2,
      s.eyeLy - s.eyeLHeight / 2 + s.eyelidsAngryHeight
    );
    ctx.closePath();
    ctx.fill();
    // Right Eye
    ctx.beginPath();
    ctx.moveTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
    ctx.lineTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2);
    ctx.lineTo(
      s.eyeRx - s.eyeRWidth / 2,
      s.eyeRy - s.eyeRHeight / 2 + s.eyelidsAngryHeight
    );
    ctx.closePath();
    ctx.fill();
  }

// Happy Eyelids (Bottom)
if (s.eyelidsHappyBottomOffset > 1) {
    const offset = s.eyelidsHappyBottomOffset;

    // LEFT Eye (Bottom Lid with V shape)
    ctx.beginPath();
    ctx.moveTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy + s.eyeLHeight / 2); // left corner
    ctx.lineTo(s.eyeLx, s.eyeLy + s.eyeLHeight / 2 + offset);         // bottom point (V)
    ctx.lineTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy + s.eyeLHeight / 2); // right corner
    ctx.stroke();
}

  // Sad Eyelids (Top)

  if (s.eyelidsSadTopOffset > 1) {
    // Left Eye - Sadness (inverted angry shape)
    ctx.beginPath();
    ctx.moveTo(s.eyeLx + s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2); // top-right
    ctx.lineTo(s.eyeLx - s.eyeLWidth / 2, s.eyeLy - s.eyeLHeight / 2 - 2); // top-left
    ctx.lineTo(
      s.eyeLx - s.eyeLWidth / 2,
      s.eyeLy - s.eyeLHeight / 2 + s.eyelidsSadTopOffset
    ); // drop left side
    ctx.closePath();
    ctx.fill();

    // Right Eye - Sadness (inverted angry shape)
    ctx.beginPath();
    ctx.moveTo(s.eyeRx - s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2); // top-left
    ctx.lineTo(s.eyeRx + s.eyeRWidth / 2, s.eyeRy - s.eyeRHeight / 2 - 2); // top-right
    ctx.lineTo(
      s.eyeRx + s.eyeRWidth / 2,
      s.eyeRy - s.eyeRHeight / 2 + s.eyelidsSadTopOffset
    ); // drop right side
    ctx.closePath();
    ctx.fill();
  }
}

// --- Emotion State Changers ---
// These functions set the 'next' state, triggering the animation.
function setEmotion(emotion) {
  const d = eyeState.defaults;
  // Reset to defaults before applying new emotion
  eyeState.next = { ...d };

  switch (emotion) {
    case "anger":
      eyeState.next.color = "#FF4500"; // Red-orange
      eyeState.next.eyeLHeight = d.eyeLHeight * 0.8;
      eyeState.next.eyeRHeight = d.eyeRHeight * 0.8;
      eyeState.next.eyelidsAngryHeight = d.eyeLHeight * 0.55;
      break;
    case "joy":
      eyeState.next.color = "#ffffff"; // white (default)
      eyeState.next.eyeLHeight = d.eyeLHeight * 0.6; // squint more
      eyeState.next.eyeRHeight = d.eyeRHeight * 0.6;
      eyeState.next.eyeLWidth = d.eyeLWidth * 1.05; // a bit wider
      eyeState.next.eyeRWidth = d.eyeRWidth * 1.05;
      eyeState.next.eyelidsHappyBottomOffset = d.eyeLHeight * 1.2; // stronger curve
      break;
    case "sadness":
      eyeState.next.eyelidsSadTopOffset =
        Math.max(d.eyeLHeight, d.eyeRHeight) * 0.65;
      break;
    case "fear":
      eyeState.next.color = "#ffffff"; // optional: pale eyes
      eyeState.next.eyeLHeight = d.eyeLHeight * 1.4; // big height
      eyeState.next.eyeRHeight = d.eyeRHeight * 1.4;
      eyeState.next.eyeLWidth = d.eyeLWidth * 1.3; // wide
      eyeState.next.eyeRWidth = d.eyeRWidth * 1.3;
      eyeState.next.eyeLBorderRadius = d.eyeLHeight * 0.6; // soften edges
      eyeState.next.eyeRBorderRadius = d.eyeRHeight * 0.6;
      // eyelids stay open — no overlays
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
      eyeState.next.eyeLBorderRadius = 4;
      eyeState.next.eyeRBorderRadius = 4;
      break;
    case "neutral":
    default:
      // The reset at the start handles this
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
  connectAndListen();
})();