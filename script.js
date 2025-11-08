const heartNotes = [
  {
    title: "Doa 1",
    prompt: "Menjadi istri yang sholehah—yang taat kepada Allah dan suaminya.",
    letter: "Menjadi istri yang sholehah—yang taat kepada Allah dan suaminya."
  },
  {
    title: "Doa 2",
    prompt:
      "Menjadi ibu yang baik—yang penuh kasih, sabar, dan bijaksana dalam mendidik anak-anak.",
    letter:
      "Menjadi ibu yang baik—yang penuh kasih, sabar, dan bijaksana dalam mendidik anak-anak."
  },
  {
    title: "Doa 3",
    prompt: "Memiliki rumah tangga yang sakinah, mawaddah, wa rahmah.",
    letter: "Memiliki rumah tangga yang sakinah, mawaddah, wa rahmah."
  },
  {
    title: "Doa 4",
    prompt: "Dikelilingi keluarga yang sehat, bahagia, dan saling mendukung.",
    letter: "Dikelilingi keluarga yang sehat, bahagia, dan saling mendukung."
  },
  {
    title: "Doa 5",
    prompt: "Diberi rezeki yang berkah, cukup, dan selalu membawa manfaat.",
    letter: "Diberi rezeki yang berkah, cukup, dan selalu membawa manfaat."
  },
  {
    title: "Doa 6",
    prompt:
      "Tetap rendah hati dan istiqamah dalam kebaikan, di mana pun dan kapan pun.",
    letter:
      "Tetap rendah hati dan istiqamah dalam kebaikan, di mana pun dan kapan pun."
  }
];

const playArea = document.getElementById("playArea");
const playerEl = document.getElementById("player");
const messageEl = document.getElementById("message");
const progressLabel = document.getElementById("progressLabel");
const progressFill = document.getElementById("progressFill");
const startBtn = document.getElementById("startBtn");
const finalLetter = document.getElementById("finalLetter");
const letterList = document.getElementById("letterList");
const replayBtn = document.getElementById("replayBtn");
const giftBtn = document.getElementById("giftBtn");
const giftOverlay = document.getElementById("giftOverlay");
const giftClose = document.getElementById("giftClose");
const giftBoxes = document.querySelectorAll(".gift-box");

const state = {
  player: { x: 0, y: 0, size: 42, speed: 0.28 },
  keys: new Set(),
  hearts: [],
  collected: 0,
  running: false,
  lastTime: 0,
  animationId: null,
  pointerTarget: { active: false, x: 0, y: 0 }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function setupStarfield() {
  const canvas = document.getElementById("sky");
  const ctx = canvas.getContext("2d");
  let stars = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.4 + 0.2,
      speed: Math.random() * 0.03 + 0.01,
      alpha: 0.4 + Math.random() * 0.6
    }));
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach((star) => {
      star.y += star.speed * 60;
      if (star.y > canvas.height + 10) {
        star.y = -10;
        star.x = Math.random() * canvas.width;
      }
      ctx.globalAlpha = star.alpha;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff9f5";
      ctx.fill();
    });
    requestAnimationFrame(render);
  }

  window.addEventListener("resize", () => {
    resize();
    positionHearts();
    resetPlayer();
  });

  resize();
  render();
}

function setupControls() {
  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    a: "left",
    s: "down",
    d: "right"
  };

  const handle = (event, isDown) => {
    const key = keyMap[event.key] || keyMap[event.key.toLowerCase()];
    if (!key) return;
    event.preventDefault();
    if (isDown) {
      state.keys.add(key);
    } else {
      state.keys.delete(key);
    }
  };

  window.addEventListener("keydown", (event) => handle(event, true));
  window.addEventListener("keyup", (event) => handle(event, false));
}

function setupPointerControls() {
  const updateTarget = (event) => {
    if (!state.running) return;
    const rect = playArea.getBoundingClientRect();
    state.pointerTarget.active = true;
    state.pointerTarget.x = clamp(event.clientX - rect.left, 0, rect.width);
    state.pointerTarget.y = clamp(event.clientY - rect.top, 0, rect.height);
  };

  playArea.addEventListener("pointerdown", (event) => {
    if (!state.running) return;
    if (playArea.setPointerCapture) {
      try {
        playArea.setPointerCapture(event.pointerId);
      } catch (error) {
        // ignore pointer capture issues
      }
    }
    updateTarget(event);
  });

  playArea.addEventListener("pointermove", (event) => {
    if (!state.pointerTarget.active) return;
    updateTarget(event);
  });

  const releaseTarget = (event) => {
    if (playArea.releasePointerCapture && event) {
      try {
        playArea.releasePointerCapture(event.pointerId);
      } catch (error) {
        // ignore release errors
      }
    }
    state.pointerTarget.active = false;
  };

  playArea.addEventListener("pointerup", releaseTarget);
  playArea.addEventListener("pointercancel", releaseTarget);
  playArea.addEventListener("pointerleave", () => {
    state.pointerTarget.active = false;
  });
}

function createHearts() {
  state.hearts.forEach((heart) => heart.element.remove());
  state.hearts = [];

  const presetPositions = [
    [0.2, 0.3],
    [0.75, 0.25],
    [0.15, 0.65],
    [0.85, 0.55],
    [0.45, 0.78],
    [0.7, 0.85]
  ];

  heartNotes.forEach((note, index) => {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.style.animationDelay = `${index * 0.2}s`;
    playArea.appendChild(heart);

    const [relX, relY] =
      presetPositions[index] ||
      [0.15 + Math.random() * 0.7, 0.25 + Math.random() * 0.6];

    const heartData = {
      element: heart,
      relX,
      relY,
      x: 0,
      y: 0,
      collected: false,
      note
    };

    heart.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!state.running || heartData.collected) return;
      state.pointerTarget.active = false;
      collectHeart(heartData);
    });

    state.hearts.push(heartData);
  });

  positionHearts();
}

function positionHearts() {
  if (!playArea) return;
  const { clientWidth: width, clientHeight: height } = playArea;
  state.hearts.forEach((heart) => {
    heart.x = heart.relX * width;
    heart.y = heart.relY * height;
    heart.element.style.left = `${heart.x}px`;
    heart.element.style.top = `${heart.y}px`;
  });
}

function resetPlayer() {
  const { clientWidth: width, clientHeight: height } = playArea;
  state.player.x = width / 2;
  state.player.y = height / 2;
  state.pointerTarget.active = false;
  updatePlayerPosition();
}

function updatePlayerPosition() {
  playerEl.style.left = `${state.player.x}px`;
  playerEl.style.top = `${state.player.y}px`;
}

function updatePlayer(delta) {
  const { clientWidth: width, clientHeight: height } = playArea;
  const margin = state.player.size / 2 + 6;
  const step = delta * state.player.speed;
  let dx = 0;
  let dy = 0;

  if (state.keys.has("left")) dx -= 1;
  if (state.keys.has("right")) dx += 1;
  if (state.keys.has("up")) dy -= 1;
  if (state.keys.has("down")) dy += 1;

  let usingInput = dx !== 0 || dy !== 0;

  if (state.pointerTarget.active) {
    const diffX = state.pointerTarget.x - state.player.x;
    const diffY = state.pointerTarget.y - state.player.y;
    const distance = Math.hypot(diffX, diffY);
    if (distance > 3) {
      dx = diffX;
      dy = diffY;
      usingInput = true;
    } else {
      state.pointerTarget.active = false;
    }
  }

  if (usingInput) {
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    state.player.x += dx * step;
    state.player.y += dy * step;
  }

  state.player.x = clamp(state.player.x, margin, width - margin);
  state.player.y = clamp(state.player.y, margin, height - margin);
  updatePlayerPosition();
  checkCollisions();
}

function checkCollisions() {
  state.hearts.forEach((heart) => {
    if (heart.collected) return;
    const distance = Math.hypot(heart.x - state.player.x, heart.y - state.player.y);
    if (distance < 42) {
      collectHeart(heart);
    }
  });
}

function collectHeart(heart) {
  heart.collected = true;
  heart.element.classList.add("collected");
  state.collected += 1;
  messageEl.innerHTML = `<strong>${heart.note.title}</strong>: ${heart.note.prompt}`;
  updateProgress();
  spawnSparkles(heart.x, heart.y);

  if (state.collected === heartNotes.length) {
    finishQuest();
  }
}

function updateProgress() {
  const total = heartNotes.length;
  const percent = (state.collected / total) * 100;
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = `Hearts gathered: ${state.collected} / ${total}`;
}

function spawnSparkles(x, y) {
  for (let i = 0; i < 10; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "sparkle";
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.setProperty("--dx", `${(Math.random() - 0.5) * 90}px`);
    sparkle.style.setProperty("--dy", `${(Math.random() - 0.5) * 90}px`);
    playArea.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 900);
  }
}

function finishQuest() {
  state.running = false;
  if (state.animationId) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  state.keys.clear();
  state.pointerTarget.active = false;
  messageEl.innerHTML =
    "<strong>Semua hati terkumpul!</strong> Setiap alasan itu nyata, dan masih ada jutaan lainnya.";
  progressLabel.textContent = "Hearts gathered: complete";
  setTimeout(() => finalLetter.classList.remove("hidden"), 400);
  renderLetterList();
  replayBtn.classList.remove("hidden");
  if (giftBtn) giftBtn.classList.remove("hidden");
}

function renderLetterList() {
  letterList.innerHTML = heartNotes.map((note) => `<li>${note.letter}</li>`).join("");
}

function openGiftOverlay() {
  if (!giftOverlay) return;
  giftOverlay.classList.remove("hidden");
  giftOverlay.setAttribute("aria-hidden", "false");
}

function closeGiftOverlay() {
  if (!giftOverlay) return;
  giftOverlay.classList.add("hidden");
  giftOverlay.setAttribute("aria-hidden", "true");
}

function gameLoop(timestamp) {
  if (!state.running) return;
  const delta = timestamp - state.lastTime;
  state.lastTime = timestamp;
  updatePlayer(delta);
  state.animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  state.running = true;
  state.collected = 0;
  state.keys.clear();
  state.pointerTarget.active = false;
  progressFill.style.width = "0%";
  messageEl.textContent =
    "Pelan-pelan aja ya, nikmati tiap hati yang kamu kumpulin. Di ponsel, sentuh dan geser lembut langit malamnya.";
  startBtn.classList.add("hidden");
  finalLetter.classList.add("hidden");
  replayBtn.classList.add("hidden");
  if (giftBtn) giftBtn.classList.add("hidden");
  closeGiftOverlay();
  createHearts();
  resetPlayer();
  updateProgress();
  state.lastTime = performance.now();
  if (state.animationId) cancelAnimationFrame(state.animationId);
  state.animationId = requestAnimationFrame(gameLoop);
}

function init() {
  setupStarfield();
  setupControls();
  setupPointerControls();
  renderLetterList();
  startBtn.addEventListener("click", startGame);
  replayBtn.addEventListener("click", startGame);
  messageEl.textContent =
    "Use arrow keys/WASD on desktop, or tap + drag the night sky on your phone to guide the glowing firefly. Collect each heart to uncover another reason you are loved.";
  if (giftBtn) giftBtn.addEventListener("click", openGiftOverlay);
  if (giftClose) giftClose.addEventListener("click", closeGiftOverlay);
  if (giftOverlay) {
    giftOverlay.addEventListener("click", (event) => {
      if (event.target === giftOverlay) {
        closeGiftOverlay();
      }
    });
  }
  giftBoxes.forEach((box) => {
    box.addEventListener("click", () => {
      box.classList.add("active");
      const parent = box.closest(".gift-item");
      if (parent) parent.classList.add("revealed");
      setTimeout(() => box.classList.remove("active"), 1200);
    });
  });
  closeGiftOverlay();
}

init();
