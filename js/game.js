const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// === ФОН ===
const background = loadImage("assets/background.png");

// === СПРАЙТЫ МАГА ===
const sprites = {
  runRight: loadImage("assets/mag_run right.png"),
  runLeft: loadImage("assets/mag_run left.png"),
  stayRight: loadImage("assets/mag_stay right.png"),
  stayLeft: loadImage("assets/mag_stay left.png"),
  shootRight: loadImage("assets/mag_shoot right.png"),
  shootLeft: loadImage("assets/mag_shoot left.png"),
};

const frameCounts = {
  runRight: 11,
  runLeft: 11,
  stayRight: 7,
  stayLeft: 7,
  shootRight: 10,
  shootLeft: 10
};

// === МАГ ===
let mageX = 512;
let mageY = 512;
let direction = "right";
let isMoving = false;
let isShooting = false;

const frameW = 32;
const frameH = 32;
let currentFrame = 0;
let frameTimer = 0;
const frameInterval = 100;

const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// === МОБ ===
const mobSprites = {
  walk: loadImage("assets/run pepe 2 boss.png"),
  attack: loadImage("assets/boss pepe 2 shoot.png"),
};

const mob = {
  x: 200,
  y: 500,
  state: "idle", // idle, chase, flee, attack
  frame: 0,
  timer: 0,
  interval: 150,
  width: 64,
  height: 64,
  walkFrames: 8,
  attackFrames: 10,
  speed: 0.8,
  behaviorTimer: 0,
  behaviorInterval: 3000,
  dirX: 1,
  dirY: 0
};

// === UPDATE ===
function update(dt) {
  // === ДВИЖЕНИЕ МАГА ===
  isMoving = false;
  isShooting = keys[" "];

  let moveX = 0;
  let moveY = 0;

  if (keys["ArrowRight"]) {
    moveX += 2;
    direction = "right";
  }
  if (keys["ArrowLeft"]) {
    moveX -= 2;
    direction = "left";
  }
  if (keys["ArrowUp"]) {
    moveY -= 2;
  }
  if (keys["ArrowDown"]) {
    moveY += 2;
  }

  isMoving = moveX !== 0 || moveY !== 0;

  mageX += moveX;
  mageY += moveY;

  const mapWidth = background.width || 1024;
  const mapHeight = background.height || 1024;

  mageX = Math.max(0, Math.min(mageX, mapWidth - frameW));
  mageY = Math.max(0, Math.min(mageY, mapHeight - frameH));

  // === АНИМАЦИЯ МАГА ===
  frameTimer += dt;
  if (frameTimer > frameInterval) {
    frameTimer = 0;

    const currentKey = isShooting
      ? (direction === "right" ? "shootRight" : "shootLeft")
      : isMoving
        ? (direction === "right" ? "runRight" : "runLeft")
        : (direction === "right" ? "stayRight" : "stayLeft");

    currentFrame = (currentFrame + 1) % frameCounts[currentKey];
  }

  // === AI МОБА ===
  mob.timer += dt;
  mob.behaviorTimer += dt;

  // Расстояние между мобом и магом
  let dx = mageX - mob.x;
  let dy = mageY - mob.y;
  let distance = Math.sqrt(dx * dx + dy * dy) || 1;

  // Если подошёл слишком близко — пугается
  if (mob.state !== "attack" && distance < 80) {
    mob.state = "flee";
    mob.behaviorTimer = 0;
  }

  // Поведение меняется каждые 3 секунды
  if (mob.behaviorTimer > mob.behaviorInterval) {
    mob.behaviorTimer = 0;

    if (mob.state === "flee") {
      mob.state = "chase";
    } else {
      const r = Math.random();
      if (r < 0.6) {
        mob.state = "chase";
      } else {
        mob.state = "idle";
      }
    }
  }

  // Направление движения в зависимости от поведения
  dx = mageX - mob.x;
  dy = mageY - mob.y;
  let length = Math.sqrt(dx * dx + dy * dy) || 1;

  if (mob.state === "chase") {
    mob.dirX = dx / length;
    mob.dirY = dy / length;
  } else if (mob.state === "flee") {
    mob.dirX = -dx / length;
    mob.dirY = -dy / length;
  } else {
    mob.dirX = 0;
    mob.dirY = 0;
  }

  // АНИМАЦИЯ МОБА
  if (mob.timer > mob.interval) {
    mob.timer = 0;

    if (mob.state === "attack") {
      mob.frame++;
      if (mob.frame >= mob.attackFrames) {
        mob.frame = 0;
        mob.state = "chase";
      }
    } else {
      mob.frame = (mob.frame + 1) % mob.walkFrames;

      if (mob.state === "chase" && Math.random() < 0.1) {
        mob.state = "attack";
        mob.frame = 0;
      }
    }
  }

  // ДВИЖЕНИЕ МОБА
  if (mob.state !== "idle" && mob.state !== "attack") {
    mob.x += mob.dirX * mob.speed;
    mob.y += mob.dirY * mob.speed;

    const mw = background.width || 1024;
    const mh = background.height || 1024;

    mob.x = Math.max(0, Math.min(mob.x, mw - mob.width));
    mob.y = Math.max(0, Math.min(mob.y, mh - mob.height));
  }
}

// === DRAW ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgX = (canvas.width - background.width) / 2;
  const bgY = (canvas.height - background.height) / 2;
  ctx.drawImage(background, bgX, bgY);

  // МОБ (с масштабом ×1.5)
  const mobSprite = mob.state === "attack" ? mobSprites.attack : mobSprites.walk;
  ctx.drawImage(
    mobSprite,
    mob.frame * mob.width, 0, mob.width, mob.height,
    bgX + mob.x, bgY + mob.y,
    mob.width * 1.5, mob.height * 1.5
  );

  // МАГ
  const sprite = isShooting
    ? (direction === "right" ? sprites.shootRight : sprites.shootLeft)
    : isMoving
      ? (direction === "right" ? sprites.runRight : sprites.runLeft)
      : (direction === "right" ? sprites.stayRight : sprites.stayLeft);

  ctx.drawImage(
    sprite,
    currentFrame * frameW, 0, frameW, frameH,
    bgX + mageX, bgY + mageY, frameW * 2, frameH * 2
  );
}

// === GAME LOOP ===
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

background.onload = () => {
  requestAnimationFrame(gameLoop);
};
