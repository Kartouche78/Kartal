const game = document.getElementById('game');
const player = document.getElementById('player');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const pauseOverlay = document.getElementById('pauseOverlay');
const pauseButton = document.getElementById('pauseButton');
const hearts = document.querySelectorAll('.life');
const finalScore = document.getElementById('finalScore');
const gameOverInfo = document.getElementById('gameOverInfo');
const resetGameButton = document.getElementById('resetGame');
const restartButton = document.getElementById('restartButton');

// Sons
const shootSound = new Audio('tir.wav');
shootSound.volume = 0.3;

let currentColumn = 1;
let score = 0;
let level = 1;
let lives = 4;
let enemySpeed = 15;
let enemySpawnRate = 500;
const columnCount = 3;

let lastShotTime = 0;
const shootCooldown = 150;
let isPaused = false;
let gameOver = false;

let activeBulletsPerColumn = [0, 0, 0];
const maxBulletsPerColumn = 8;
const maxLevel = 9;

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function updatePlayerPosition() {
  const columnWidth = game.clientWidth / columnCount;
  player.style.left = `${currentColumn * columnWidth + columnWidth / 2 - 50}px`;
}

function togglePause() {
  if (gameOver) return;
  isPaused = !isPaused;
  pauseOverlay.classList.toggle('hidden');
  pauseButton.style.display = isPaused ? 'block' : 'none';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'p') {
    togglePause();
    return;
  }
  if (e.key.toLowerCase() === 'r') {
    restartGame();
    return;
  }

  if (isPaused || gameOver) return;

  if ((e.key === 'ArrowLeft' || e.key.toLowerCase() === 'q') && currentColumn > 0) {
    currentColumn--;
    updatePlayerPosition();
  } else if ((e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') && currentColumn < columnCount - 1) {
    currentColumn++;
    updatePlayerPosition();
  } else if (e.key === ' ') {
    shootBullet();
  }
});

game.addEventListener('click', () => {
  if (!isPaused && !gameOver) {
    shootBullet();
  }
});

if (isMobile()) {
  const controlsContainer = document.createElement('div');
  controlsContainer.style.position = 'absolute';
  controlsContainer.style.bottom = '10px';
  controlsContainer.style.left = '50%';
  controlsContainer.style.transform = 'translateX(-50%)';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.gap = '20px';
  controlsContainer.style.zIndex = '100';

  const createBtn = (emoji, onClick) => {
    const btn = document.createElement('button');
    btn.innerText = emoji;
    btn.style.width = '60px';
    btn.style.height = '60px';
    btn.style.fontSize = '28px';
    btn.style.border = 'none';
    btn.style.borderRadius = '50%';
    btn.style.background = '#fff';
    btn.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    btn.style.cursor = 'pointer';
    btn.onclick = onClick;
    return btn;
  };

  const leftBtn = createBtn('⬅️', () => {
    if (currentColumn > 0) {
      currentColumn--;
      updatePlayerPosition();
    }
  });

  const shootBtn = createBtn('⬆️', () => {
    shootBullet();
  });

  const rightBtn = createBtn('➡️', () => {
    if (currentColumn < columnCount - 1) {
      currentColumn++;
      updatePlayerPosition();
    }
  });

  controlsContainer.appendChild(leftBtn);
  controlsContainer.appendChild(rightBtn);
  game.appendChild(controlsContainer);
}

function shootBullet() {
  if (activeBulletsPerColumn[currentColumn] >= maxBulletsPerColumn) return;

  const now = Date.now();
  if (now - lastShotTime < shootCooldown) return;
  lastShotTime = now;

  shootSound.currentTime = 0;
  shootSound.play();

  activeBulletsPerColumn[currentColumn]++;

  const bulletColumn = currentColumn;

  const bullet = document.createElement('div');
  bullet.classList.add('bullet');

  const columnWidth = game.clientWidth / columnCount;
  bullet.style.left = `${bulletColumn * columnWidth + columnWidth / 2 - 25}px`;
  bullet.style.bottom = `110px`;

  game.appendChild(bullet);

  const interval = setInterval(() => {
    if (isPaused || gameOver) return;

    const currentBottom = parseFloat(bullet.style.bottom);
    if (currentBottom >= game.clientHeight) {
      bullet.remove();
      clearInterval(interval);
      activeBulletsPerColumn[bulletColumn]--;
    } else {
      bullet.style.bottom = `${currentBottom + 10}px`;
      checkBulletCollision(bullet, interval, bulletColumn);
    }
  }, 30);
}

function spawnEnemy() {
  if (isPaused || gameOver) return;

  const enemy = document.createElement('div');
  enemy.classList.add('enemy');

  const column = Math.floor(Math.random() * columnCount);
  const columnWidth = game.clientWidth / columnCount;

  enemy.style.left = `${column * columnWidth + columnWidth / 2 - 50}px`;
  enemy.style.top = '0px';

  game.appendChild(enemy);

  const interval = setInterval(() => {
    if (isPaused || gameOver) return;

    const currentTop = parseFloat(enemy.style.top);
    if (currentTop >= game.clientHeight - 110) {
      enemy.remove();
      clearInterval(interval);
      loseLife();
    } else {
      enemy.style.top = `${currentTop + 7}px`;
    }
  }, enemySpeed);

  enemy.dataset.interval = interval;
}

function checkBulletCollision(bullet, bulletInterval, bulletColumn) {
  document.querySelectorAll('.enemy').forEach(enemy => {
    const bulletRect = bullet.getBoundingClientRect();
    const enemyRect = enemy.getBoundingClientRect();
    if (
      bulletRect.left < enemyRect.right &&
      bulletRect.right > enemyRect.left &&
      bulletRect.top < enemyRect.bottom &&
      bulletRect.bottom > enemyRect.top
    ) {
      const enemyLeft = enemy.offsetLeft;
      const enemyTop = enemy.offsetTop;

      bullet.remove();
      enemy.remove();
      clearInterval(bulletInterval);
      clearInterval(enemy.dataset.interval);
      activeBulletsPerColumn[bulletColumn]--;

      const explosionSound = new Audio('explosion.mp3');
      explosionSound.volume = 0.4;
      explosionSound.play();

      score++;
      checkLevelUp();
      scoreDisplay.textContent = `Score: ${score} | Niveau: ${level}`;

      const plusOne = document.createElement('div');
      plusOne.textContent = '+1';
      plusOne.style.position = 'absolute';
      plusOne.style.color = 'lime';
      plusOne.style.fontSize = '24px';
      plusOne.style.fontWeight = 'bold';
      plusOne.style.left = `${enemyLeft + 20}px`;
      plusOne.style.top = `${enemyTop}px`;
      plusOne.style.zIndex = '10';
      game.appendChild(plusOne);
      setTimeout(() => plusOne.remove(), 1000);
    }
  });
}

function checkLevelUp() {
  const newLevel = Math.floor(score / 10) + 1;
  if ((score >= 200 && level < maxLevel) || (newLevel > level && newLevel <= maxLevel)) {
    level = Math.min(maxLevel, level + 1);
    enemySpeed = Math.max(5, enemySpeed - 2);
    enemySpawnRate = Math.max(100, enemySpawnRate - 50);
    clearInterval(spawnLoop);
    spawnLoop = setInterval(spawnEnemy, enemySpawnRate);
  }
}

function loseLife() {
  lives--;
  if (hearts[lives]) hearts[lives].style.visibility = 'hidden';
  if (lives <= 0) triggerGameOver();
}

function triggerGameOver() {
  gameOver = true;
  isPaused = true;
  pauseOverlay.classList.remove('hidden');
  pauseButton.style.display = 'none';
  gameOverInfo.classList.remove('hidden');
  finalScore.textContent = `Score final : ${score}`;
}

function restartGame() {
  location.reload();
}

resetGameButton.addEventListener('click', restartGame);
restartButton.addEventListener('click', restartGame);

let spawnLoop = setInterval(spawnEnemy, enemySpawnRate);
window.onload = updatePlayerPosition;
