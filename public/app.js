import * as THREE from "https://unpkg.com/three@0.161.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.161.0/examples/jsm/loaders/GLTFLoader.js";

const ui = {
  stage: document.getElementById("stage"),
  status: document.getElementById("status"),
  btnStart: document.getElementById("btnStart"),
  btnStop: document.getElementById("btnStop"),
  log: document.getElementById("log"),
  remoteAudio: document.getElementById("remoteAudio"),
};

let pc = null;
let dc = null;
let localStream = null;

let audioCtx = null;
let analyser = null;
let speakingLevel = 0; // 0..1 suavizado

// ====== THREE (avatar) ======
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(ui.stage.clientWidth, ui.stage.clientHeight);
ui.stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, ui.stage.clientWidth / ui.stage.clientHeight, 0.1, 100);
camera.position.set(0, 1.5, 2.4);

const light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(2, 4, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

let avatarRoot = null;
let mouthTarget = null;   // referencia al mesh con morph targets
let mouthIndex = null;    // índice del morph de boca
let blinkIndex = null;

function findMorphIndex(mesh, keys) {
  if (!mesh?.morphTargetDictionary) return null;
  for (const k of keys) {
    if (k in mesh.morphTargetDictionary) return mesh.morphTargetDictionary[k];
  }
  return null;
}

async function loadAvatar() {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync("/avatar.glb");
  avatarRoot = gltf.scene;
  avatarRoot.position.set(0, 0, 0);
  scene.add(avatarRoot);

  // Busca el primer mesh con morph targets
  avatarRoot.traverse((o) => {
    if (!mouthTarget && o.isMesh && o.morphTargetInfluences && o.morphTargetInfluences.length) {
      mouthTarget = o;
    }
  });

  if (mouthTarget) {
    // Intenta nombres típicos
    mouthIndex = findMorphIndex(mouthTarget, ["JawOpen", "jawOpen", "MouthOpen", "mouthOpen", "viseme_aa"]);
    blinkIndex = findMorphIndex(mouthTarget, ["Blink", "blink", "EyeBlink", "eyeBlink"]);
  }
}

function setMorph(idx, v) {
  if (!mouthTarget || idx == null) return;
  mouthTarget.morphTargetInfluences[idx] = THREE.MathUtils.clamp(v, 0, 1);
}

let tBlink = 0;
function animate(dt) {
  // Lip-sync por energía del audio (simple pero funciona)
  setMorph(mouthIndex, speakingLevel);

  // Parpadeo "humano"
  tBlink += dt;
  if (blinkIndex != null) {
    const blink = (Math.sin(tBlink * 0.9) > 0.995) ? 1 : 0;
    setMorph(blinkIndex, blink);
  }

  renderer.render(scene, camera);
  requestAnimationFrame((t) => animate((t / 1000) % 1));
}

window.addEventListener("resize", () => {
  renderer.setSize(ui.stage.clientWidth, ui.stage.clientHeight);
  camera.aspect = ui.stage.clientWidth / ui.stage.clientHeight;
  camera.updateProjectionMatrix();
});

// ====== AUDIO -> mouth level ======
function attachAnalyserFromRemoteStream(stream) {
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  const src = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  const tick = () => {
    if (!analyser) return;
    analyser.getByteTimeDomainData(data);

    // RMS simple
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const x = (data[i] - 128) / 128;
      sum += x * x;
    }
    const rms = Math.sqrt(sum / data.length); // ~0..0.2 típico
    const target = THREE.MathUtils.clamp(rms * 6.0, 0, 1); // ganancia

    // Suavizado
    speakingLevel = speakingLevel * 0.85 + target * 0.15;
    requestAnimationFrame(tick);
  };
  tick();
}

// ====== REALTIME (WebRTC) ======
function logAppend(text) {
  ui.log.textContent += text;
  ui.log.scrollTop = ui.log.scrollHeight;
}

function setStatus(s) {
  ui.status.textContent = s;
}

async function connectRealtime() {
  // 1) PeerConnection
  pc = new RTCPeerConnection();

  // Audio remoto del modelo
  pc.ontrack = (e) => {
    ui.remoteAudio.srcObject = e.streams[0];
    attachAnalyserFromRemoteStream(e.streams[0]);
  };

  // 2) Micro
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  pc.addTrack(localStream.getTracks()[0], localStream);

  // 3) DataChannel (eventos)
  dc = pc.createDataChannel("oai-events");
  dc.onmessage = (e) => {
    const evt = JSON.parse(e.data);

    // Muestra transcripción del audio de salida si llega
    if (evt.type === "response.output_audio_transcript.delta" && evt.delta) {
      logAppend(evt.delta);
    }
    if (evt.type === "response.output_audio_transcript.done") {
      logAppend("\n\n");
    }
  };

  dc.onopen = () => {
    setStatus("Conectado (habla cuando quieras)");

    // Ajusta instrucciones / modalidad (audio + transcript)
    const sessionUpdate = {
      type: "session.update",
      session: {
        type: "realtime",
        model: "gpt-realtime",
        output_modalities: ["audio", "text"],
        instructions:
          "Eres un oficinista amable y eficiente. Responde en español, con frases claras. " +
          "Haz preguntas cortas si falta contexto. No menciones que eres una IA.",
      },
    };
    dc.send(JSON.stringify(sessionUpdate));
  };

  // 4) SDP offer -> tu server -> OpenAI -> SDP answer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  const sdpResponse = await fetch("/session", {
    method: "POST",
    headers: { "Content-Type": "application/sdp" },
    body: offer.sdp,
  });

  const answer = { type: "answer", sdp: await sdpResponse.text() };
  await pc.setRemoteDescription(answer);
}

function disconnectRealtime() {
  if (localStream) localStream.getTracks().forEach((t) => t.stop());
  localStream = null;

  if (dc) dc.close();
  dc = null;

  if (pc) pc.close();
  pc = null;

  analyser = null;
  speakingLevel = 0;
  setStatus("Desconectado");
}

// ====== UI ======
ui.btnStart.onclick = async () => {
  ui.btnStart.disabled = true;
  ui.btnStop.disabled = false;
  ui.log.textContent = "";
  setStatus("Conectando…");
  await connectRealtime();
};

ui.btnStop.onclick = () => {
  ui.btnStart.disabled = false;
  ui.btnStop.disabled = true;
  disconnectRealtime();
};

// Arranca escena
await loadAvatar();
requestAnimationFrame((t) => animate((t / 1000) % 1));
