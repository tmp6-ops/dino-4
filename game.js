// Dino Runner Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const highScoreEl = document.getElementById('highScore');
const currentScoreEl = document.getElementById('currentScore');
const overlayEl = document.getElementById('gameOverlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlaySubtitle = document.getElementById('overlaySubtitle');
const actionBtn = document.getElementById('actionBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIcon = document.getElementById('soundIcon');
const jumpTouchBtn = document.getElementById('jumpTouchBtn');
const duckTouchBtn = document.getElementById('duckTouchBtn');

// Game State Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 260;
const GROUND_Y = 220;

// High Score Persistence
let highScore = parseInt(localStorage.getItem('dino_high_score') || '0', 10);
highScoreEl.innerText = `HI ${String(highScore).padStart(5, '0')}`;

let gameState = 'START'; // 'START' | 'PLAYING' | 'GAMEOVER'
let score = 0;
let lastMilestone = 0;
let baseSpeed = 7.5;
let currentSpeed = baseSpeed;
let nightMode = false;

// Controls State
const keys = {
  jump: false,
  duck: false
};

// --- Dino Character ---
class Dino {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 50;
    this.width = 44;
    this.height = 47;
    this.y = GROUND_Y - this.height;
    this.vy = 0;
    this.gravity = 0.68;
    this.jumpForce = -13.5;
    this.isGrounded = true;
    this.isDucking = false;
    this.legStep = 0;
    this.stepTimer = 0;
  }

  jump() {
    if (this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      window.soundCtrl.playJump();
    }
  }

  duck(state) {
    if (this.isDucking === state) return;
    this.isDucking = state;

    if (this.isDucking) {
      this.width = 55;
      this.height = 28;
    } else {
      this.width = 44;
      this.height = 47;
    }

    if (this.isGrounded) {
      this.y = GROUND_Y - this.height;
    }
  }

  update(dt) {
    // Jump physics
    if (!this.isGrounded) {
      // Faster fall if down key is pressed in mid-air
      if (keys.duck) {
        this.vy += this.gravity * 2.2;
      } else {
        this.vy += this.gravity;
      }
      this.y += this.vy;

      if (this.y >= GROUND_Y - this.height) {
        this.y = GROUND_Y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Running leg animation
    if (this.isGrounded) {
      this.stepTimer += dt;
      if (this.stepTimer > 80) {
        this.legStep = (this.legStep + 1) % 2;
        this.stepTimer = 0;
      }
    }
  }

  draw(context, color) {
    context.save();
    context.fillStyle = color;

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (gameState === 'GAMEOVER') {
      // Dead Dino with X eye
      this.drawDead(context, x, y, color);
    } else if (this.isDucking) {
      // Ducking Dino
      this.drawDucking(context, x, y);
    } else {
      // Normal Running / Jumping Dino
      this.drawRunning(context, x, y);
    }

    context.restore();
  }

  drawRunning(c, x, y) {
    // Head & Snout
    c.fillRect(x + 22, y, 22, 16);
    c.fillRect(x + 18, y + 4, 4, 12);
    // Eye cutout (white/transparent)
    c.clearRect(x + 26, y + 3, 3, 3);

    // Mouth cutout
    c.clearRect(x + 36, y + 10, 8, 2);

    // Neck & Body
    c.fillRect(x + 16, y + 16, 16, 12);
    c.fillRect(x + 10, y + 20, 20, 16);
    c.fillRect(x + 4, y + 24, 6, 10);
    // Tail
    c.fillRect(x, y + 28, 4, 4);

    // Tiny arm
    c.fillRect(x + 24, y + 24, 6, 4);

    // Legs
    if (!this.isGrounded) {
      // In air - feet together
      c.fillRect(x + 12, y + 36, 4, 8);
      c.fillRect(x + 12, y + 44, 6, 3);
      c.fillRect(x + 22, y + 36, 4, 8);
      c.fillRect(x + 22, y + 44, 6, 3);
    } else if (this.legStep === 0) {
      // Left leg forward
      c.fillRect(x + 10, y + 36, 4, 8);
      c.fillRect(x + 10, y + 44, 6, 3);
      // Right leg back/up
      c.fillRect(x + 22, y + 36, 4, 5);
    } else {
      // Right leg forward
      c.fillRect(x + 14, y + 36, 4, 5);
      // Left leg back
      c.fillRect(x + 22, y + 36, 4, 8);
      c.fillRect(x + 22, y + 44, 6, 3);
    }
  }

  drawDucking(c, x, y) {
    // Elongated body
    c.fillRect(x, y + 8, 40, 14);
    // Lower head
    c.fillRect(x + 35, y + 4, 20, 12);
    // Eye cutout
    c.clearRect(x + 42, y + 6, 3, 3);
    // Tail
    c.fillRect(x - 4, y + 10, 4, 4);

    // Legs cycling while ducking
    if (this.legStep === 0) {
      c.fillRect(x + 14, y + 22, 5, 6);
      c.fillRect(x + 28, y + 22, 5, 4);
    } else {
      c.fillRect(x + 14, y + 22, 5, 4);
      c.fillRect(x + 28, y + 22, 5, 6);
    }
  }

  drawDead(c, x, y, color) {
    this.drawRunning(c, x, y);
    // Overlay X on eye
    c.fillStyle = color;
    c.fillRect(x + 26, y + 3, 1, 1);
    c.fillRect(x + 28, y + 3, 1, 1);
    c.fillRect(x + 27, y + 4, 1, 1);
    c.fillRect(x + 26, y + 5, 1, 1);
    c.fillRect(x + 28, y + 5, 1, 1);
  }

  getHitbox() {
    // Inset slightly to make collision forgiving and fair
    const padding = 4;
    return {
      x: this.x + padding,
      y: this.y + padding,
      width: this.width - padding * 2,
      height: this.height - padding * 2
    };
  }
}

// --- Obstacle Classes (Cactus & Pterodactyl) ---
class Cactus {
  constructor(x, type) {
    this.x = x;
    this.type = type; // 'small', 'large', 'cluster'
    if (type === 'small') {
      this.width = 17;
      this.height = 35;
    } else if (type === 'large') {
      this.width = 24;
      this.height = 48;
    } else {
      this.width = 44;
      this.height = 36;
    }
    this.y = GROUND_Y - this.height;
  }

  update(speed) {
    this.x -= speed;
  }

  draw(context, color) {
    context.fillStyle = color;
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (this.type === 'small') {
      // Main stem
      context.fillRect(x + 6, y, 6, 35);
      // Left arm
      context.fillRect(x, y + 10, 6, 4);
      context.fillRect(x, y + 6, 4, 8);
      // Right arm
      context.fillRect(x + 11, y + 14, 6, 4);
      context.fillRect(x + 13, y + 10, 4, 8);
    } else if (this.type === 'large') {
      // Big stem
      context.fillRect(x + 8, y, 8, 48);
      // Left arm
      context.fillRect(x, y + 15, 8, 6);
      context.fillRect(x, y + 8, 6, 12);
      // Right arm
      context.fillRect(x + 16, y + 20, 8, 6);
      context.fillRect(x + 18, y + 12, 6, 12);
    } else {
      // Cluster of 2
      context.fillRect(x + 4, y + 4, 5, 32);
      context.fillRect(x, y + 12, 5, 4);
      context.fillRect(x + 9, y + 16, 5, 4);

      context.fillRect(x + 22, y, 7, 36);
      context.fillRect(x + 16, y + 10, 6, 5);
      context.fillRect(x + 29, y + 14, 6, 5);
    }
  }

  getHitbox() {
    return {
      x: this.x + 3,
      y: this.y + 2,
      width: this.width - 6,
      height: this.height - 2
    };
  }
}

class Bird {
  constructor(x, heightType) {
    this.x = x;
    this.width = 40;
    this.height = 30;
    // heightType: 0 = high (can walk under), 1 = medium (must duck), 2 = low (must jump)
    if (heightType === 0) {
      this.y = GROUND_Y - 72;
    } else if (heightType === 1) {
      this.y = GROUND_Y - 50;
    } else {
      this.y = GROUND_Y - 30;
    }
    this.flapTimer = 0;
    this.wingUp = false;
  }

  update(speed, dt) {
    this.x -= speed * 1.08; // Birds fly slightly faster
    this.flapTimer += dt;
    if (this.flapTimer > 180) {
      this.wingUp = !this.wingUp;
      this.flapTimer = 0;
    }
  }

  draw(context, color) {
    context.fillStyle = color;
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    // Beak & Head
    context.fillRect(x, y + 10, 12, 6);
    context.fillRect(x + 12, y + 8, 14, 10);
    // Body & Tail
    context.fillRect(x + 26, y + 10, 14, 6);

    // Wings
    if (this.wingUp) {
      context.fillRect(x + 14, y, 8, 8);
    } else {
      context.fillRect(x + 14, y + 18, 8, 8);
    }
  }

  getHitbox() {
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 8
    };
  }
}

// --- Cloud & Ground Decoration ---
class Cloud {
  constructor(x) {
    this.x = x;
    this.y = 30 + Math.random() * 50;
    this.speed = 1 + Math.random() * 0.8;
  }

  update() {
    this.x -= this.speed;
    if (this.x < -60) {
      this.x = GAME_WIDTH + Math.random() * 80;
      this.y = 30 + Math.random() * 50;
    }
  }

  draw(context, color) {
    context.fillStyle = color;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    context.fillRect(x + 10, y, 24, 8);
    context.fillRect(x + 4, y + 6, 36, 8);
    context.fillRect(x, y + 10, 44, 6);
  }
}

// --- Main Game Engine ---
const dino = new Dino();
let obstacles = [];
let clouds = [
  new Cloud(200),
  new Cloud(450),
  new Cloud(720)
];

let groundOffset = 0;
let lastTime = 0;
let spawnTimer = 0;

function checkCollision(r1, r2) {
  return !(
    r1.x + r1.width < r2.x ||
    r1.x > r2.x + r2.width ||
    r1.y + r1.height < r2.y ||
    r1.y > r2.y + r2.height
  );
}

function spawnObstacle() {
  const minGap = Math.max(220, 480 - currentSpeed * 14);
  const lastObstacle = obstacles[obstacles.length - 1];

  if (!lastObstacle || (GAME_WIDTH - lastObstacle.x) > minGap) {
    // Randomly choose between cactus or flying pterodactyl (after score > 200)
    const canSpawnBird = score > 200 && Math.random() < 0.35;

    if (canSpawnBird) {
      const heightType = Math.floor(Math.random() * 3);
      obstacles.push(new Bird(GAME_WIDTH + 20, heightType));
    } else {
      const types = ['small', 'large', 'cluster'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      obstacles.push(new Cactus(GAME_WIDTH + 20, chosenType));
    }
  }
}

function startGame() {
  gameState = 'PLAYING';
  score = 0;
  lastMilestone = 0;
  currentSpeed = baseSpeed;
  obstacles = [];
  dino.reset();
  overlayEl.classList.add('hidden');
  window.soundCtrl.init();
}

function gameOver() {
  gameState = 'GAMEOVER';
  window.soundCtrl.playHit();

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('dino_high_score', highScore);
    highScoreEl.innerText = `HI ${String(highScore).padStart(5, '0')}`;
  }

  overlayTitle.innerText = 'GAME OVER';
  overlaySubtitle.innerHTML = `Score: <strong>${String(Math.floor(score)).padStart(5, '0')}</strong><br>Press <strong>SPACE</strong> or <strong>Restart</strong>`;
  actionBtn.innerText = 'RESTART';
  overlayEl.classList.remove('hidden');
}

function update(dt) {
  if (gameState !== 'PLAYING') return;

  // Gradual speed progression
  currentSpeed = baseSpeed + Math.min(score * 0.006, 9.0);

  // Score progression
  score += dt * 0.015;
  const displayScore = Math.floor(score);
  currentScoreEl.innerText = String(displayScore).padStart(5, '0');

  // Milestone beep every 100 points
  if (displayScore > 0 && displayScore % 100 === 0 && displayScore !== lastMilestone) {
    lastMilestone = displayScore;
    window.soundCtrl.playScoreMilestone();
  }

  // Day / Night cycle every 400 points
  const cycle = Math.floor(score / 350) % 2;
  const isNight = cycle === 1;
  if (isNight !== nightMode) {
    nightMode = isNight;
    if (nightMode) {
      document.body.classList.add('night-mode');
    } else {
      document.body.classList.remove('night-mode');
    }
  }

  // Clouds
  clouds.forEach(c => c.update());

  // Ground line animation
  groundOffset = (groundOffset + currentSpeed) % 24;

  // Dino update
  dino.update(dt);

  // Spawn obstacles
  spawnTimer += dt;
  if (spawnTimer > 600) {
    if (Math.random() < 0.6) {
      spawnObstacle();
    }
    spawnTimer = 0;
  }

  // Update Obstacles & Collision Check
  const dinoBox = dino.getHitbox();
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.update(currentSpeed, dt);

    if (checkCollision(dinoBox, obs.getHitbox())) {
      gameOver();
      return;
    }

    // Remove off-screen obstacles
    if (obs.x + obs.width < -30) {
      obstacles.splice(i, 1);
    }
  }
}

function draw() {
  const mainColor = nightMode ? '#e8eaed' : '#535353';
  const groundColor = nightMode ? '#757575' : '#888888';
  const cloudColor = nightMode ? '#3c4043' : '#d8d8d8';

  // Clear Canvas
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Clouds
  clouds.forEach(c => c.draw(ctx, cloudColor));

  // Ground Line with pixel ticks
  ctx.strokeStyle = groundColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(GAME_WIDTH, GROUND_Y);
  ctx.stroke();

  // Ground texture bumps
  ctx.fillStyle = groundColor;
  for (let x = -groundOffset; x < GAME_WIDTH; x += 24) {
    ctx.fillRect(x + 4, GROUND_Y + 4, 3, 2);
    ctx.fillRect(x + 12, GROUND_Y + 7, 5, 2);
    ctx.fillRect(x + 19, GROUND_Y + 3, 2, 2);
  }

  // Obstacles
  obstacles.forEach(obs => obs.draw(ctx, mainColor));

  // Dino
  dino.draw(ctx, mainColor);
}

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(timestamp - lastTime, 50); // Clamp frame lag
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(gameLoop);
}

// --- Input Event Handlers ---
function handleJumpAction() {
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    startGame();
  } else if (gameState === 'PLAYING') {
    dino.jump();
  }
}

function handleDuckAction(isDucking) {
  keys.duck = isDucking;
  if (gameState === 'PLAYING') {
    dino.duck(isDucking);
  }
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    keys.jump = true;
    handleJumpAction();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    handleDuckAction(true);
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    keys.jump = false;
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    handleDuckAction(false);
  }
});

actionBtn.addEventListener('click', () => {
  handleJumpAction();
});

// Mobile / On-screen Buttons
jumpTouchBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleJumpAction();
});
jumpTouchBtn.addEventListener('mousedown', () => {
  handleJumpAction();
});

duckTouchBtn.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleDuckAction(true);
});
duckTouchBtn.addEventListener('touchend', (e) => {
  e.preventDefault();
  handleDuckAction(false);
});
duckTouchBtn.addEventListener('mousedown', () => {
  handleDuckAction(true);
});
duckTouchBtn.addEventListener('mouseup', () => {
  handleDuckAction(false);
});
duckTouchBtn.addEventListener('mouseleave', () => {
  handleDuckAction(false);
});

// Sound Toggle Button
soundToggleBtn.addEventListener('click', () => {
  const isEnabled = window.soundCtrl.toggleSound();
  soundIcon.innerText = isEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
});

// Start loop
requestAnimationFrame(gameLoop);

