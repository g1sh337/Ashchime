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

// === СПРАЙТ СНАРЯДА ===
const projectileSprite = loadImage("assets/projectile.png"); // Замените на нужный файл

const frameCounts = {
  runRight: 11,
  runLeft: 11,
  stayRight: 7,
  stayLeft: 7,
  shootRight: 10,
  shootLeft: 10
};

// === МАГ ===
let mage = {
  x: 512,
  y: 512,
  direction: "right",
  isMoving: false,
  isShooting: false,
  currentFrame: 0,
  frameTimer: 0,
  frameInterval: 100,
  health: 100,
  maxHealth: 100,
  lastShot: 0,
  shootCooldown: 300
};

const frameW = 32;
const frameH = 32;

// === СНАРЯДЫ ===
let projectiles = [];

function createProjectile(x, y, direction) {
  if (Date.now() - mage.lastShot < mage.shootCooldown) return;
  
  mage.lastShot = Date.now();
  projectiles.push({
    x: x + frameW,
    y: y + frameH / 2,
    vx: direction === "right" ? 5 : -5,
    vy: 0,
    size: 32,        // Размер картинки снаряда
    life: 1000,
    created: Date.now(),
    direction: direction  // Добавляем направление для поворота картинки
  });
}

// === УПРАВЛЕНИЕ ===
const keys = {};
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

// === МОБИЛЬНОЕ УПРАВЛЕНИЕ ===
let touchControls = {
  left: false,
  right: false,
  up: false,
  down: false,
  shoot: false
};

// Определение мобильного устройства
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 ('ontouchstart' in window);

if (isMobile) {
  // Создание виртуальных кнопок
  createMobileControls();
}

function createMobileControls() {
  const controlsDiv = document.createElement('div');
  controlsDiv.style.position = 'fixed';
  controlsDiv.style.bottom = '20px';
  controlsDiv.style.left = '20px';
  controlsDiv.style.right = '20px';
  controlsDiv.style.display = 'flex';
  controlsDiv.style.justifyContent = 'space-between';
  controlsDiv.style.pointerEvents = 'none';
  controlsDiv.style.zIndex = '1000';

  // Левая сторона - движение
  const moveDiv = document.createElement('div');
  moveDiv.style.position = 'relative';
  moveDiv.style.width = '120px';
  moveDiv.style.height = '120px';
  
  // Кнопки движения
  const directions = [
    {key: 'up', top: '0px', left: '40px', symbol: '↑'},
    {key: 'left', top: '40px', left: '0px', symbol: '←'},
    {key: 'right', top: '40px', left: '80px', symbol: '→'},
    {key: 'down', top: '80px', left: '40px', symbol: '↓'}
  ];

  directions.forEach(dir => {
    const btn = document.createElement('div');
    btn.style.position = 'absolute';
    btn.style.top = dir.top;
    btn.style.left = dir.left;
    btn.style.width = '40px';
    btn.style.height = '40px';
    btn.style.backgroundColor = 'rgba(255,255,255,0.7)';
    btn.style.border = '2px solid #333';
    btn.style.borderRadius = '5px';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.fontSize = '20px';
    btn.style.fontWeight = 'bold';
    btn.style.pointerEvents = 'auto';
    btn.style.userSelect = 'none';
    btn.textContent = dir.symbol;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchControls[dir.key] = true;
      btn.style.backgroundColor = 'rgba(200,200,255,0.9)';
    });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      touchControls[dir.key] = false;
      btn.style.backgroundColor = 'rgba(255,255,255,0.7)';
    });

    moveDiv.appendChild(btn);
  });

  // Правая сторона - стрельба
  const shootBtn = document.createElement('div');
  shootBtn.style.width = '60px';
  shootBtn.style.height = '60px';
  shootBtn.style.backgroundColor = 'rgba(255,100,100,0.8)';
  shootBtn.style.border = '3px solid #800';
  shootBtn.style.borderRadius = '50%';
  shootBtn.style.display = 'flex';
  shootBtn.style.alignItems = 'center';
  shootBtn.style.justifyContent = 'center';
  shootBtn.style.fontSize = '24px';
  shootBtn.style.fontWeight = 'bold';
  shootBtn.style.pointerEvents = 'auto';
  shootBtn.style.userSelect = 'none';
  shootBtn.textContent = '🔥';

  shootBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchControls.shoot = true;
    shootBtn.style.backgroundColor = 'rgba(255,150,150,1)';
  });

  shootBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    touchControls.shoot = false;
    shootBtn.style.backgroundColor = 'rgba(255,100,100,0.8)';
  });

  controlsDiv.appendChild(moveDiv);
  controlsDiv.appendChild(shootBtn);
  document.body.appendChild(controlsDiv);
}

// === МОБ С УЛУЧШЕННЫМ AI ===
const mobSprites = {
  walk: loadImage("assets/run pepe 2 boss.png"),
  attack: loadImage("assets/boss pepe 2 shoot.png"),
};

const mob = {
  x: 200,
  y: 500,
  state: "patrol", // patrol, chase, attack, stunned, enraged
  frame: 0,
  timer: 0,
  interval: 120,
  width: 64,
  height: 64,
  walkFrames: 8,
  attackFrames: 10,
  speed: 1.2,
  behaviorTimer: 0,
  behaviorInterval: 2000,
  dirX: 1,
  dirY: 0,
  health: 50,
  maxHealth: 50,
  lastAttack: 0,
  attackCooldown: 1500,
  aggroRange: 150,
  attackRange: 60,
  patrolTarget: {x: 200, y: 500},
  isEnraged: false,
  stunTimer: 0
};

// === UPDATE ===
function update(dt) {
  // === ДВИЖЕНИЕ МАГА ===
  mage.isMoving = false;
  mage.isShooting = keys[" "] || touchControls.shoot;

  let moveX = 0;
  let moveY = 0;

  if (keys["ArrowRight"] || touchControls.right) {
    moveX += 2;
    mage.direction = "right";
  }
  if (keys["ArrowLeft"] || touchControls.left) {
    moveX -= 2;
    mage.direction = "left";
  }
  if (keys["ArrowUp"] || touchControls.up) {
    moveY -= 2;
  }
  if (keys["ArrowDown"] || touchControls.down) {
    moveY += 2;
  }

  mage.isMoving = moveX !== 0 || moveY !== 0;

  mage.x += moveX;
  mage.y += moveY;

  const mapWidth = background.width || 1024;
  const mapHeight = background.height || 1024;

  mage.x = Math.max(0, Math.min(mage.x, mapWidth - frameW));
  mage.y = Math.max(0, Math.min(mage.y, mapHeight - frameH));

  // === СТРЕЛЬБА ===
  if (mage.isShooting) {
    createProjectile(mage.x, mage.y, mage.direction);
  }

  // === АНИМАЦИЯ МАГА ===
  mage.frameTimer += dt;
  if (mage.frameTimer > mage.frameInterval) {
    mage.frameTimer = 0;

    const currentKey = mage.isShooting
      ? (mage.direction === "right" ? "shootRight" : "shootLeft")
      : mage.isMoving
        ? (mage.direction === "right" ? "runRight" : "runLeft")
        : (mage.direction === "right" ? "stayRight" : "stayLeft");

    mage.currentFrame = (mage.currentFrame + 1) % frameCounts[currentKey];
  }

  // === ОБНОВЛЕНИЕ СНАРЯДОВ ===
  projectiles = projectiles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    // Проверка столкновения с мобом
    if (p.x > mob.x && p.x < mob.x + mob.width * 1.5 &&
        p.y > mob.y && p.y < mob.y + mob.height * 1.5) {
      mob.health -= 10;
      mob.state = "stunned";
      mob.stunTimer = 500;
      if (mob.health <= 20) mob.isEnraged = true;
      return false;
    }
    
    return Date.now() - p.created < p.life && 
           p.x > -10 && p.x < mapWidth + 10;
  });

  // === УЛУЧШЕННЫЙ AI МОБА ===
  mob.timer += dt;
  mob.behaviorTimer += dt;
  if (mob.stunTimer > 0) mob.stunTimer -= dt;

  // Расстояние между мобом и магом
  let dx = mage.x - mob.x;
  let dy = mage.y - mob.y;
  let distance = Math.sqrt(dx * dx + dy * dy) || 1;

  // Состояние моба
  if (mob.stunTimer <= 0) {
    if (distance < mob.attackRange && Date.now() - mob.lastAttack > mob.attackCooldown) {
      mob.state = "attack";
      mob.lastAttack = Date.now();
      mob.frame = 0;
      
      // Нанесение урона магу
      if (distance < 40) {
        mage.health -= 15;
      }
    } else if (distance < mob.aggroRange || mob.isEnraged) {
      mob.state = "chase";
    } else if (mob.behaviorTimer > mob.behaviorInterval) {
      mob.state = "patrol";
      mob.behaviorTimer = 0;
      // Новая цель патрулирования
      mob.patrolTarget.x = Math.random() * (mapWidth - mob.width);
      mob.patrolTarget.y = Math.random() * (mapHeight - mob.height);
    }
  } else {
    mob.state = "stunned";
  }

  // Направление движения
  if (mob.state === "chase") {
    let length = Math.sqrt(dx * dx + dy * dy) || 1;
    mob.dirX = dx / length;
    mob.dirY = dy / length;
    mob.speed = mob.isEnraged ? 2.0 : 1.2;
  } else if (mob.state === "patrol") {
    let pdx = mob.patrolTarget.x - mob.x;
    let pdy = mob.patrolTarget.y - mob.y;
    let plen = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
    if (plen > 10) {
      mob.dirX = pdx / plen;
      mob.dirY = pdy / plen;
    } else {
      mob.dirX = 0;
      mob.dirY = 0;
    }
    mob.speed = 0.8;
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
    } else if (mob.state !== "stunned") {
      mob.frame = (mob.frame + 1) % mob.walkFrames;
    }
  }

  // ДВИЖЕНИЕ МОБА
  if (mob.state !== "attack" && mob.state !== "stunned") {
    mob.x += mob.dirX * mob.speed;
    mob.y += mob.dirY * mob.speed;

    mob.x = Math.max(0, Math.min(mob.x, mapWidth - mob.width));
    mob.y = Math.max(0, Math.min(mob.y, mapHeight - mob.height));
  }

  // Проверка смерти
  if (mage.health <= 0) {
    // Перезапуск игры
    mage.health = mage.maxHealth;
    mage.x = 512;
    mage.y = 512;
    mob.health = mob.maxHealth;
    mob.isEnraged = false;
    projectiles = [];
  }

  if (mob.health <= 0) {
    // Респавн моба
    mob.health = mob.maxHealth;
    mob.x = Math.random() * 400 + 100;
    mob.y = Math.random() * 400 + 100;
    mob.isEnraged = false;
    mob.state = "patrol";
  }
}

// === DRAW ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bgX = (canvas.width - background.width) / 2;
  const bgY = (canvas.height - background.height) / 2;
  ctx.drawImage(background, bgX, bgY);

  // СНАРЯДЫ (теперь картинки)
  projectiles.forEach(p => {
    ctx.save();
    
    // Поворачиваем картинку в зависимости от направления
    if (p.direction === "left") {
      ctx.scale(-1, 1);
      ctx.drawImage(
        projectileSprite,
        -(bgX + p.x + p.size/2), 
        bgY + p.y - p.size/2,
        p.size, p.size
      );
    } else {
      ctx.drawImage(
        projectileSprite,
        bgX + p.x - p.size/2, 
        bgY + p.y - p.size/2,
        p.size, p.size
      );
    }
    
    ctx.restore();
  });

  // МОБ (с цветовой индикацией состояния)
  ctx.save();
  if (mob.isEnraged) {
    ctx.filter = "hue-rotate(0deg) saturate(200%) brightness(1.2)";
  } else if (mob.stunTimer > 0) {
    ctx.filter = "grayscale(50%) brightness(0.7)";
  }

  const mobSprite = mob.state === "attack" ? mobSprites.attack : mobSprites.walk;
  ctx.drawImage(
    mobSprite,
    mob.frame * mob.width, 0, mob.width, mob.height,
    bgX + mob.x, bgY + mob.y,
    mob.width * 1.5, mob.height * 1.5
  );
  ctx.restore();

  // МАГ
  const sprite = mage.isShooting
    ? (mage.direction === "right" ? sprites.shootRight : sprites.shootLeft)
    : mage.isMoving
      ? (mage.direction === "right" ? sprites.runRight : sprites.runLeft)
      : (mage.direction === "right" ? sprites.stayRight : sprites.stayLeft);

  ctx.drawImage(
    sprite,
    mage.currentFrame * frameW, 0, frameW, frameH,
    bgX + mage.x, bgY + mage.y, frameW * 2, frameH * 2
  );

  // UI - ЗДОРОВЬЕ
  drawHealthBar(20, 20, mage.health, mage.maxHealth, "#00ff00", "Ral");
  drawHealthBar(20, 60, mob.health, mob.maxHealth, "#ff4444", "Pepe Boss");

  // Индикатор ярости моба
  if (mob.isEnraged) {
    ctx.fillStyle = "#ff0000";
    ctx.font = "16px Arial";
    ctx.fillText("f8ck p3p3", 20, 110);
  }
}

function drawHealthBar(x, y, current, max, color, label) {
  const width = 200;
  const height = 20;
  
  // Фон
  ctx.fillStyle = "#333";
  ctx.fillRect(x, y, width, height);
  
  // Здоровье
  ctx.fillStyle = color;
  ctx.fillRect(x, y, (current / max) * width, height);
  
  // Рамка
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // Подпись
  ctx.fillStyle = "#fff";
  ctx.font = "12px Arial";
  ctx.fillText(`${label}: ${current}/${max}`, x, y - 5);
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