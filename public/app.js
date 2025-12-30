// ===== DEBUG: muestra errores en el panel =====
window.addEventListener("error", (e) => {
  const log = document.getElementById("log");
  if (log) log.textContent += `\n[JS ERROR] ${e.message}\n`;
});

window.addEventListener("unhandledrejection", (e) => {
  const log = document.getElementById("log");
  if (log) log.textContent += `\n[PROMISE ERROR] ${e.reason}\n`;
});

const _log = document.getElementById("log");
if (_log) _log.textContent = "[OK] app.js se está ejecutando\n";

// ===== IMPORTS (local desde /vendor) =====
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const ui = {
  stage: document.getElementById("stage"),
  status: document.getElementById("status"),
  btnStart: document.getElementById("btnStart"),
  btnStop: document.getElementById("btnStop"),
  log: document.getElementById("log"),
  remoteAudio: document.getElementById("remoteAudio"),
};

function logLine(s) {
  ui.log.textContent += (ui.log.textContent ? "\n" : "") + s;
}

// ===== THREE: setup con fondo transparente =====
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setClearAlpha(0); // transparente para ver el fondo CSS
ui.stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
// NO scene.background - dejamos transparente

const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 200);
camera.position.set(0, 1.35, 2.2);
camera.lookAt(0, 1.25, 0);

scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(2, 4, 2);
scene.add(dir);

// Luz de relleno frontal
const fill = new THREE.DirectionalLight(0xffffff, 0.5);
fill.position.set(0, 1, 3);
scene.add(fill);

// ===== CÁMARA PARA VIDEOLLAMADA (solo cabeza) =====
camera.fov = 25;
camera.position.set(0, 1.55, 2.25);
camera.lookAt(0, 1.55, 0);
camera.updateProjectionMatrix();

function resizeRenderer() {
  const w = ui.stage.clientWidth || 1;
  const h = ui.stage.clientHeight || 1;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resizeRenderer);
resizeRenderer();

let avatarRoot = null;
let mouthTarget = null;
let mouthIndex = null;
let blinkIndex = null;

function findMorphIndex(mesh, keys) {
  if (!mesh?.morphTargetDictionary) return null;
  for (const k of keys) {
    if (k in mesh.morphTargetDictionary) return mesh.morphTargetDictionary[k];
  }
  return null;
}

// ===== POSICIÓN CABEZA =====
// Solo mostramos la cabeza, el cuerpo está en la imagen de fondo
const AVATAR_SCALE = 1.2;
const AVATAR_X = 0.0;       // izquierda/derecha
const AVATAR_Y = 0.15;      // arriba/abajo
const AVATAR_Z = 0.0;       // delante/detrás

function firstSkinnedMesh(root) {
  let sk = null;
  root.traverse(o => { if (!sk && o.isSkinnedMesh) sk = o; });
  return sk;
}

function boneBy(root, patterns) {
  const sk = firstSkinnedMesh(root);
  if (!sk?.skeleton) return null;
  return sk.skeleton.bones.find(b =>
    patterns.some(re => re.test(b.name))
  ) || null;
}

function applySeatedPose(root) {
  // Reset skeleton to base pose first
  const sk = firstSkinnedMesh(root);
  if (sk?.skeleton) sk.skeleton.pose();

  const LArm = boneBy(root, [/LeftArm/i, /UpperArm_L/i, /Arm_L/i, /mixamorigLeftArm/i]);
  const LFore = boneBy(root, [/LeftForeArm/i, /LowerArm_L/i, /ForeArm_L/i]);
  const RArm = boneBy(root, [/RightArm/i, /UpperArm_R/i, /Arm_R/i, /mixamorigRightArm/i]);
  const RFore = boneBy(root, [/RightForeArm/i, /LowerArm_R/i, /ForeArm_R/i]);

  // Brazos hacia abajo (rotation.z para bajar desde T-pose)
  if (LArm) { LArm.rotation.z = 1.2; LArm.rotation.x = 0.0; }
  if (RArm) { RArm.rotation.z = -1.2; RArm.rotation.x = 0.0; }

  // Antebrazos ligeramente doblados
  if (LFore) { LFore.rotation.y = 0.3; }
  if (RFore) { RFore.rotation.y = -0.3; }

  logLine("Pose sentada aplicada ✅");
}

function positionAvatar(root) {
  root.scale.setScalar(AVATAR_SCALE);
  root.position.set(AVATAR_X, AVATAR_Y, AVATAR_Z);
}

async function loadAvatar() {
  logLine("Cargando /avatar.glb ...");
  const loader = new GLTFLoader();

  const gltf = await loader.loadAsync("/avatar.glb");
  avatarRoot = gltf.scene;

  // Mostrar SOLO la cabeza (el cuerpo está en la imagen de fondo)
  avatarRoot.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.castShadow = false;
      o.receiveShadow = false;

      const n = (o.name || "").toLowerCase();

      // Solo mostrar partes de la cabeza
      const isHead =
        n.includes("head") ||
        n.includes("face") ||
        n.includes("teeth") ||
        n.includes("tongue") ||
        n.includes("eye") ||
        n.includes("eyebrow") ||
        n.includes("lash") ||
        n.includes("hair") ||
        n.includes("beard");

      o.visible = isHead;

      // Buscar morph targets (solo en meshes visibles)
      if (isHead && !mouthTarget && o.morphTargetInfluences && o.morphTargetInfluences.length) {
        mouthTarget = o;
        mouthIndex = findMorphIndex(o, ["JawOpen", "jawOpen", "MouthOpen", "mouthOpen", "viseme_aa"]);
        blinkIndex = findMorphIndex(o, ["Blink", "blink", "EyeBlink", "eyeBlink", "eyeBlinkLeft"]);
        logLine("Morphs: " + Object.keys(o.morphTargetDictionary || {}).join(", "));
      }
    }
  });

  scene.add(avatarRoot);

  // Posicionar y aplicar pose sentada
  positionAvatar(avatarRoot);
  applySeatedPose(avatarRoot);

  logLine("Avatar cargado ✅");
  if (mouthIndex !== null) logLine("Lip-sync disponible ✅");
}

function addFallbackCube() {
  const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const mat = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
  const cube = new THREE.Mesh(geo, mat);
  cube.position.set(0, 0.25, 0);
  scene.add(cube);
  logLine("Mostrando cubo fallback (no se cargó el avatar).");
}

function setMorph(idx, v) {
  if (!mouthTarget || idx == null) return;
  mouthTarget.morphTargetInfluences[idx] = THREE.MathUtils.clamp(v, 0, 1);
}

// ===== AUDIO -> mouth level =====
let audioCtx = null;
let analyser = null;
let speakingLevel = 0;

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
    const rms = Math.sqrt(sum / data.length);
    const target = THREE.MathUtils.clamp(rms * 6.0, 0, 1);

    // Suavizado
    speakingLevel = speakingLevel * 0.85 + target * 0.15;
    requestAnimationFrame(tick);
  };
  tick();
}

// ===== RENDER LOOP =====
let lastT = performance.now();
let tBlink = 0;

function tick(t) {
  const dt = Math.min((t - lastT) / 1000, 0.05);
  lastT = t;

  // Lip-sync por energía del audio
  setMorph(mouthIndex, speakingLevel);

  // Parpadeo "humano"
  tBlink += dt;
  if (blinkIndex != null) {
    const blink = (Math.sin(tBlink * 0.9) > 0.995) ? 1 : 0;
    setMorph(blinkIndex, blink);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ===== WEBRTC (OpenAI Realtime) =====
let pc = null;
let dc = null;
let localStream = null;

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
      logLine(evt.delta);
    }
    if (evt.type === "response.output_audio_transcript.done") {
      logLine("\n");
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

  if (!sdpResponse.ok) {
    const err = await sdpResponse.text();
    logLine("Error conectando: " + err);
    setStatus("Error");
    return;
  }

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

// ===== UI =====
ui.btnStart.onclick = async () => {
  ui.btnStart.disabled = true;
  ui.btnStop.disabled = false;
  setStatus("Conectando…");
  await connectRealtime();
};

ui.btnStop.onclick = () => {
  ui.btnStart.disabled = false;
  ui.btnStop.disabled = true;
  disconnectRealtime();
};

// ===== AJUSTE CABEZA (teclas para calibrar posición) =====
window.addEventListener("keydown", (e) => {
  if (!avatarRoot) return;
  const step = e.shiftKey ? 0.10 : 0.02;

  if (e.key === "ArrowUp")    avatarRoot.position.y += step;
  if (e.key === "ArrowDown")  avatarRoot.position.y -= step;
  if (e.key === "ArrowRight") avatarRoot.position.x += step;
  if (e.key === "ArrowLeft")  avatarRoot.position.x -= step;
  if (e.key === "+")          avatarRoot.scale.multiplyScalar(1.05);
  if (e.key === "-")          avatarRoot.scale.multiplyScalar(0.95);

  logLine(`pos: x=${avatarRoot.position.x.toFixed(2)} y=${avatarRoot.position.y.toFixed(2)} | scale=${avatarRoot.scale.x.toFixed(2)}`);
});

// ===== INIT =====
(async () => {
  try {
    await loadAvatar();
    logLine("Flechas=mover cabeza, +/-=tamaño");
  } catch (e) {
    console.error(e);
    logLine("ERROR cargando avatar: " + (e?.message || e));
    addFallbackCube();
  }
  requestAnimationFrame(tick);
})();
