// Game state
let canvas;
let ctx;

let gameMode = null; // 'single' or 'two'
let gameDifficulty = 'medium'; // 'easy', 'medium', 'hard'
let gameRunning = false;
let animationId = null;

// Responsive canvas
let canvasScale = 1;
const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

// Game objects
const ball = {
    x: 400,
    y: 300,
    radius: 8,
    baseRadius: 8,
    speedX: 5,
    speedY: 5,
    speed: 5,
    baseSpeed: 5,
    bigTimer: 0
};

const paddle = {
    width: 10,
    height: 100,
    baseHeight: 100,
    speed: 8
};

const player1 = {
    x: 20,
    y: 250,
    score: 0,
    upPressed: false,
    downPressed: false,
    height: 100,
    powerUpTimer: 0,
    speed: 8,
    slowTimer: 0,
    hasMagnet: false,
    magnetTimer: 0
};

const player2 = {
    x: 770,
    y: 250,
    score: 0,
    upPressed: false,
    downPressed: false,
    height: 100,
    powerUpTimer: 0,
    speed: 8,
    slowTimer: 0,
    hasMagnet: false,
    magnetTimer: 0
};

// Power-up system
const powerUp = {
    active: false,
    x: 0,
    y: 0,
    radius: 15,
    type: 'star' // 'star', 'snail', 'magnet', 'bigball'
};

let rallyCount = 0;
let lastHitPlayer = null; // Track who last hit the ball
let ballStuckToPlayer = null; // Track if ball is stuck to a paddle
const WINNING_SCORE = 11;
const SPEED_INCREASE_INTERVAL = 3; // Speed up every 3 hits
const SPEED_INCREASE_AMOUNT = 0.3;
const MAX_SPEED = 12;
const POWER_UP_DURATION = 20000; // 20 seconds
const POWER_UP_SPAWN_CHANCE = 0.3; // 30% chance after rally

// Menu handlers
document.getElementById('singlePlayer').addEventListener('click', () => {
    gameMode = 'single';
    showDifficultyMenu();
});

document.getElementById('twoPlayer').addEventListener('click', () => {
    gameMode = 'two';
    startGame();
});

// About section toggle
document.getElementById('aboutBtn').addEventListener('click', () => {
    const aboutContent = document.getElementById('aboutContent');
    const aboutBtn = document.getElementById('aboutBtn');
    
    if (aboutContent.style.display === 'none') {
        aboutContent.style.display = 'block';
        aboutBtn.textContent = '✕ Close';
    } else {
        aboutContent.style.display = 'none';
        aboutBtn.textContent = 'ℹ️ About';
    }
});

// Control layout toggle
let controlLayoutHorizontal = false;
document.getElementById('toggleLayout').addEventListener('click', () => {
    const touchControls = document.getElementById('touchControls');
    controlLayoutHorizontal = !controlLayoutHorizontal;
    
    if (controlLayoutHorizontal) {
        touchControls.classList.add('horizontal');
    } else {
        touchControls.classList.remove('horizontal');
    }
});

document.getElementById('easyMode').addEventListener('click', () => {
    gameDifficulty = 'easy';
    startGame();
});

document.getElementById('mediumMode').addEventListener('click', () => {
    gameDifficulty = 'medium';
    startGame();
});

document.getElementById('hardMode').addEventListener('click', () => {
    gameDifficulty = 'hard';
    startGame();
});

document.getElementById('backFromDifficulty').addEventListener('click', () => {
    showMenu();
});

document.getElementById('backToMenu').addEventListener('click', () => {
    resetGame();
    showMenu();
});

document.getElementById('playAgain').addEventListener('click', () => {
    resetGame();
    startGame();
});

document.getElementById('mainMenu').addEventListener('click', () => {
    resetGame();
    showMenu();
});

// Keyboard controls
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    // Player 1 controls (W/S)
    if (e.key === 'w' || e.key === 'W') {
        player1.upPressed = true;
        e.preventDefault();
    }
    if (e.key === 's' || e.key === 'S') {
        player1.downPressed = true;
        e.preventDefault();
    }
    
    // Player 1 release ball (E)
    if (e.key === 'e' || e.key === 'E') {
        if (ballStuckToPlayer === 1) {
            releaseBall(1);
        }
        e.preventDefault();
    }
    
    // Player 2 controls (P/L keys) - only in two player mode
    if (gameMode === 'two') {
        if (e.key === 'p' || e.key === 'P') {
            player2.upPressed = true;
            e.preventDefault();
        }
        if (e.key === 'l' || e.key === 'L') {
            player2.downPressed = true;
            e.preventDefault();
        }
        
        // Player 2 release ball (O)
        if (e.key === 'o' || e.key === 'O') {
            if (ballStuckToPlayer === 2) {
                releaseBall(2);
            }
            e.preventDefault();
        }
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    
    if (e.key === 'w' || e.key === 'W') player1.upPressed = false;
    if (e.key === 's' || e.key === 'S') player1.downPressed = false;
    
    if (gameMode === 'two') {
        if (e.key === 'p' || e.key === 'P') player2.upPressed = false;
        if (e.key === 'l' || e.key === 'L') player2.downPressed = false;
    }
});

function startGame() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('difficultyMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    
    // Update UI based on game mode
    if (gameMode === 'single') {
        document.getElementById('player2Name').textContent = 'Computer';
        document.getElementById('player2Controls').style.display = 'none';
        document.getElementById('p2TouchControls').style.display = 'none';
    } else {
        document.getElementById('player2Name').textContent = 'Player 2';
        document.getElementById('player2Controls').style.display = 'block';
        document.getElementById('p2TouchControls').style.display = 'flex';
    }
    
    resizeCanvas();
    gameRunning = true;
    gameLoop();
}

function showMenu() {
    document.getElementById('menu').style.display = 'block';
    document.getElementById('difficultyMenu').style.display = 'none';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
}

function showDifficultyMenu() {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('difficultyMenu').style.display = 'block';
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameOver').style.display = 'none';
}

function resetGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    gameRunning = false;
    player1.score = 0;
    player2.score = 0;
    player1.y = canvas.height / 2 - paddle.height / 2;
    player2.y = canvas.height / 2 - paddle.height / 2;
    player1.height = paddle.baseHeight;
    player2.height = paddle.baseHeight;
    player1.speed = paddle.speed;
    player2.speed = paddle.speed;
    player1.powerUpTimer = 0;
    player2.powerUpTimer = 0;
    player1.slowTimer = 0;
    player2.slowTimer = 0;
    player1.hasMagnet = false;
    player2.hasMagnet = false;
    player1.magnetTimer = 0;
    player2.magnetTimer = 0;
    rallyCount = 0;
    lastHitPlayer = null;
    ballStuckToPlayer = null;
    ball.speed = ball.baseSpeed;
    ball.radius = ball.baseRadius;
    ball.bigTimer = 0;
    powerUp.active = false;
    resetBall();
    updateScore();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // Random direction
    const angle = (Math.random() * Math.PI / 2) - Math.PI / 4;
    const direction = Math.random() < 0.5 ? 1 : -1;
    
    ball.speedX = direction * ball.speed * Math.cos(angle);
    ball.speedY = ball.speed * Math.sin(angle);
}

function spawnPowerUp() {
    if (Math.random() < POWER_UP_SPAWN_CHANCE) {
        powerUp.active = true;
        powerUp.x = canvas.width / 2 + (Math.random() - 0.5) * 200;
        powerUp.y = Math.random() * (canvas.height - 100) + 50;
        
        // Randomly choose power-up type
        const rand = Math.random();
        if (rand < 0.25) {
            powerUp.type = 'star'; // Longer paddle
        } else if (rand < 0.5) {
            powerUp.type = 'snail'; // Slower paddle (negative)
        } else if (rand < 0.75) {
            powerUp.type = 'magnet'; // Sticky ball
        } else {
            powerUp.type = 'bigball'; // Bigger ball
        }
    }
}

function checkPowerUpCollision() {
    if (!powerUp.active || !lastHitPlayer) return;
    
    const dist = Math.sqrt(
        Math.pow(ball.x - powerUp.x, 2) + 
        Math.pow(ball.y - powerUp.y, 2)
    );
    
    if (dist < ball.radius + powerUp.radius) {
        const player = lastHitPlayer === 1 ? player1 : player2;
        
        if (powerUp.type === 'star') {
            // Longer paddle
            player.height = paddle.baseHeight * 1.5;
            player.powerUpTimer = Date.now() + POWER_UP_DURATION;
        } else if (powerUp.type === 'snail') {
            // Slower paddle (negative effect)
            player.speed = paddle.speed * 0.5;
            player.slowTimer = Date.now() + POWER_UP_DURATION;
        } else if (powerUp.type === 'magnet') {
            // Sticky ball
            player.hasMagnet = true;
            player.magnetTimer = Date.now() + POWER_UP_DURATION;
        } else if (powerUp.type === 'bigball') {
            // Bigger ball (easier to hit)
            ball.radius = ball.baseRadius * 1.4;
            ball.bigTimer = Date.now() + POWER_UP_DURATION;
        }
        
        powerUp.active = false;
    }
}

function updatePowerUps() {
    const now = Date.now();
    
    // Check if power-ups expired for player 1
    if (player1.powerUpTimer > 0 && now > player1.powerUpTimer) {
        player1.height = paddle.baseHeight;
        player1.powerUpTimer = 0;
    }
    if (player1.slowTimer > 0 && now > player1.slowTimer) {
        player1.speed = paddle.speed;
        player1.slowTimer = 0;
    }
    if (player1.magnetTimer > 0 && now > player1.magnetTimer) {
        player1.hasMagnet = false;
        player1.magnetTimer = 0;
        if (ballStuckToPlayer === 1) {
            releaseBall(1);
        }
    }
    
    // Check if power-ups expired for player 2
    if (player2.powerUpTimer > 0 && now > player2.powerUpTimer) {
        player2.height = paddle.baseHeight;
        player2.powerUpTimer = 0;
    }
    if (player2.slowTimer > 0 && now > player2.slowTimer) {
        player2.speed = paddle.speed;
        player2.slowTimer = 0;
    }
    if (player2.magnetTimer > 0 && now > player2.magnetTimer) {
        player2.hasMagnet = false;
        player2.magnetTimer = 0;
        if (ballStuckToPlayer === 2) {
            releaseBall(2);
        }
    }
    
    // Check if big ball expired
    if (ball.bigTimer > 0 && now > ball.bigTimer) {
        ball.radius = ball.baseRadius;
        ball.bigTimer = 0;
    }
}

function updateScore() {
    document.getElementById('player1Score').textContent = player1.score;
    document.getElementById('player2Score').textContent = player2.score;
}

function checkWinner() {
    if (player1.score >= WINNING_SCORE) {
        endGame('Player 1 Wins!');
        return true;
    } else if (player2.score >= WINNING_SCORE) {
        const winnerName = gameMode === 'single' ? 'Computer Wins!' : 'Player 2 Wins!';
        endGame(winnerName);
        return true;
    }
    return false;
}

function endGame(winnerText) {
    gameRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('winnerText').textContent = winnerText;
}

function movePaddles() {
    // Player 1 movement
    if (player1.upPressed && player1.y > 0) {
        player1.y -= player1.speed;
    }
    if (player1.downPressed && player1.y < canvas.height - player1.height) {
        player1.y += player1.speed;
    }
    
    // If ball is stuck to player 1, move it with paddle
    if (ballStuckToPlayer === 1) {
        ball.y = player1.y + player1.height / 2;
    }
    
    // Player 2 movement (human or AI)
    if (gameMode === 'two') {
        if (player2.upPressed && player2.y > 0) {
            player2.y -= player2.speed;
        }
        if (player2.downPressed && player2.y < canvas.height - player2.height) {
            player2.y += player2.speed;
        }
    } else {
        // AI logic with difficulty levels
        const paddleCenter = player2.y + player2.height / 2;
        let aiSpeed;
        let aiAccuracy;
        
        // Adjust AI based on difficulty
        if (gameDifficulty === 'easy') {
            aiSpeed = player2.speed * 0.5; // Slower
            aiAccuracy = 30; // Less accurate (larger deadzone)
        } else if (gameDifficulty === 'medium') {
            aiSpeed = player2.speed * 0.7; // Medium speed
            aiAccuracy = 15; // Medium accuracy
        } else { // hard
            aiSpeed = player2.speed * 0.95; // Almost full speed
            aiAccuracy = 5; // Very accurate
        }
        
        if (ball.speedX > 0) { // Ball moving towards AI
            if (paddleCenter < ball.y - aiAccuracy) {
                player2.y += aiSpeed;
            } else if (paddleCenter > ball.y + aiAccuracy) {
                player2.y -= aiSpeed;
            }
        }
        
        // Keep AI paddle in bounds
        if (player2.y < 0) player2.y = 0;
        if (player2.y > canvas.height - player2.height) {
            player2.y = canvas.height - player2.height;
        }
    }
    
    // If ball is stuck to player 2, move it with paddle
    if (ballStuckToPlayer === 2) {
        ball.y = player2.y + player2.height / 2;
        
        // AI auto-release after a short delay (in single player mode)
        if (gameMode === 'single') {
            // Release ball after 0.5 seconds
            setTimeout(() => {
                if (ballStuckToPlayer === 2) {
                    releaseBall(2);
                }
            }, 500);
        }
    }
}

function releaseBall(playerNum) {
    if (ballStuckToPlayer !== playerNum) return;
    
    ballStuckToPlayer = null;
    
    // Add slight random angle to prevent purely horizontal trajectory
    const randomAngle = (Math.random() - 0.5) * 0.3; // Small random angle
    
    if (playerNum === 1) {
        ball.speedX = ball.speed * Math.cos(randomAngle);
        ball.speedY = ball.speed * Math.sin(randomAngle);
    } else {
        ball.speedX = -ball.speed * Math.cos(randomAngle);
        ball.speedY = ball.speed * Math.sin(randomAngle);
    }
}

function moveBall() {
    // Don't move ball if it's stuck to a paddle
    if (ballStuckToPlayer !== null) {
        return;
    }
    
    ball.x += ball.speedX;
    ball.y += ball.speedY;
    
    // Top and bottom wall collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.speedY = -ball.speedY;
        
        // Ensure ball never gets stuck in purely horizontal trajectory
        if (Math.abs(ball.speedY) < 0.5) {
            ball.speedY = ball.speedY >= 0 ? 1 : -1;
        }
    }
    
    // Paddle collision
    // Player 1 paddle
    if (ball.x - ball.radius < player1.x + paddle.width &&
        ball.y > player1.y &&
        ball.y < player1.y + player1.height &&
        ball.speedX < 0) {
        
        lastHitPlayer = 1; // Track that player 1 hit the ball
        
        // Check if player has magnet power-up
        if (player1.hasMagnet && ballStuckToPlayer === null) {
            ballStuckToPlayer = 1;
            ball.x = player1.x + paddle.width + ball.radius;
            ball.speedX = 0;
            ball.speedY = 0;
        } else {
            ball.speedX = -ball.speedX;
            const hitPos = (ball.y - (player1.y + player1.height / 2)) / (player1.height / 2);
            ball.speedY = hitPos * ball.speed;
            
            // Ensure minimum vertical velocity to prevent horizontal lock
            if (Math.abs(ball.speedY) < 0.5) {
                ball.speedY = hitPos >= 0 ? 0.5 : -0.5;
            }
        }
        
        // Increase rally count and speed
        rallyCount++;
        if (rallyCount % SPEED_INCREASE_INTERVAL === 0 && ball.speed < MAX_SPEED) {
            ball.speed += SPEED_INCREASE_AMOUNT;
            if (ballStuckToPlayer === null) {
                ball.speedX = ball.speedX > 0 ? ball.speed : -ball.speed;
            }
        }
        
        // Chance to spawn power-up
        if (!powerUp.active && rallyCount > 2) {
            spawnPowerUp();
        }
    }
    
    // Player 2 paddle
    if (ball.x + ball.radius > player2.x &&
        ball.y > player2.y &&
        ball.y < player2.y + player2.height &&
        ball.speedX > 0) {
        
        lastHitPlayer = 2; // Track that player 2 hit the ball
        
        // Check if player has magnet power-up
        if (player2.hasMagnet && ballStuckToPlayer === null) {
            ballStuckToPlayer = 2;
            ball.x = player2.x - ball.radius;
            ball.speedX = 0;
            ball.speedY = 0;
        } else {
            ball.speedX = -ball.speedX;
            const hitPos = (ball.y - (player2.y + player2.height / 2)) / (player2.height / 2);
            ball.speedY = hitPos * ball.speed;
            
            // Ensure minimum vertical velocity to prevent horizontal lock
            if (Math.abs(ball.speedY) < 0.5) {
                ball.speedY = hitPos >= 0 ? 0.5 : -0.5;
            }
        }
        
        // Increase rally count and speed
        rallyCount++;
        if (rallyCount % SPEED_INCREASE_INTERVAL === 0 && ball.speed < MAX_SPEED) {
            ball.speed += SPEED_INCREASE_AMOUNT;
            if (ballStuckToPlayer === null) {
                ball.speedX = ball.speedX > 0 ? ball.speed : -ball.speed;
            }
        }
        
        // Chance to spawn power-up
        if (!powerUp.active && rallyCount > 2) {
            spawnPowerUp();
        }
    }
    
    // Check power-up collision
    checkPowerUpCollision();
    
    // Score points
    if (ball.x - ball.radius < 0) {
        player2.score++;
        updateScore();
        
        // Reset all power-ups when ball goes out
        resetAllPowerUps();
        
        if (!checkWinner()) {
            resetBall();
        }
    } else if (ball.x + ball.radius > canvas.width) {
        player1.score++;
        updateScore();
        
        // Reset all power-ups when ball goes out
        resetAllPowerUps();
        
        if (!checkWinner()) {
            resetBall();
        }
    }
}

function resetAllPowerUps() {
    // Reset rally and tracking
    rallyCount = 0;
    lastHitPlayer = null;
    ballStuckToPlayer = null;
    
    // Reset ball properties
    ball.speed = ball.baseSpeed;
    ball.radius = ball.baseRadius;
    ball.bigTimer = 0;
    
    // Reset player 1 power-ups
    player1.height = paddle.baseHeight;
    player1.speed = paddle.speed;
    player1.powerUpTimer = 0;
    player1.slowTimer = 0;
    player1.hasMagnet = false;
    player1.magnetTimer = 0;
    
    // Reset player 2 power-ups
    player2.height = paddle.baseHeight;
    player2.speed = paddle.speed;
    player2.powerUpTimer = 0;
    player2.slowTimer = 0;
    player2.hasMagnet = false;
    player2.magnetTimer = 0;
    
    // Remove active power-up from field
    powerUp.active = false;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw center line
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw paddles with power-up glow
    if (player1.powerUpTimer > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
    } else if (player1.slowTimer > 0) {
        ctx.fillStyle = '#8B4513';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8B4513';
    } else if (player1.hasMagnet) {
        ctx.fillStyle = '#FF1493';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF1493';
    } else {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
    }
    ctx.fillRect(player1.x, player1.y, paddle.width, player1.height);
    
    if (player2.powerUpTimer > 0) {
        ctx.fillStyle = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FFD700';
    } else if (player2.slowTimer > 0) {
        ctx.fillStyle = '#8B4513';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#8B4513';
    } else if (player2.hasMagnet) {
        ctx.fillStyle = '#FF1493';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#FF1493';
    } else {
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
    }
    ctx.fillRect(player2.x, player2.y, paddle.width, player2.height);
    
    ctx.shadowBlur = 0;
    
    // Draw power-up
    if (powerUp.active) {
        if (powerUp.type === 'star') {
            drawStar(powerUp.x, powerUp.y, 5, powerUp.radius, powerUp.radius / 2);
        } else if (powerUp.type === 'snail') {
            drawSnail(powerUp.x, powerUp.y, powerUp.radius);
        } else if (powerUp.type === 'magnet') {
            drawMagnet(powerUp.x, powerUp.y, powerUp.radius);
        } else if (powerUp.type === 'bigball') {
            drawBigBall(powerUp.x, powerUp.y, powerUp.radius);
        }
    }
    
    // Draw ball
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700';
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;
        
        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function drawSnail(cx, cy, radius) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#8B4513';
    
    // Shell (spiral)
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx + radius * 0.2, cy - radius * 0.2, radius * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Shell spiral
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx + radius * 0.2, cy - radius * 0.2, radius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    // Body
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.3, cy + radius * 0.3, radius * 0.6, radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Antennae
    ctx.strokeStyle = '#D2B48C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.5, cy);
    ctx.lineTo(cx - radius * 0.7, cy - radius * 0.5);
    ctx.moveTo(cx - radius * 0.3, cy);
    ctx.lineTo(cx - radius * 0.4, cy - radius * 0.6);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
}

function drawMagnet(cx, cy, radius) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FF1493';
    
    // Magnet U-shape
    const width = radius * 1.2;
    const height = radius * 1.4;
    const thickness = radius * 0.4;
    
    // Left side (red)
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(cx - width / 2, cy - height / 2, thickness, height);
    
    // Right side (blue)
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(cx + width / 2 - thickness, cy - height / 2, thickness, height);
    
    // Bottom connector
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(cx - width / 2, cy + height / 2 - thickness, width, thickness);
    
    // Sparkles
    ctx.fillStyle = '#FF1493';
    ctx.beginPath();
    ctx.arc(cx - width / 2 - 3, cy - height / 3, 2, 0, Math.PI * 2);
    ctx.arc(cx + width / 2 + 3, cy - height / 3, 2, 0, Math.PI * 2);
    ctx.arc(cx, cy - height / 2 - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawBigBall(cx, cy, radius) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00FFFF';
    
    // Large ball with glow
    ctx.fillStyle = '#00FFFF';
    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Inner circle for effect
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Smaller highlight
    ctx.fillStyle = '#E0FFFF';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.2, cy - radius * 0.2, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (!gameRunning) return;
    
    movePaddles();
    moveBall();
    updatePowerUps();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Resize canvas for mobile
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    const maxWidth = Math.min(BASE_WIDTH, window.innerWidth - 40);
    const maxHeight = window.innerHeight - 300;
    
    canvasScale = Math.min(maxWidth / BASE_WIDTH, maxHeight / BASE_HEIGHT, 1);
    
    canvas.style.width = (BASE_WIDTH * canvasScale) + 'px';
    canvas.style.height = (BASE_HEIGHT * canvasScale) + 'px';
}

// Touch controls
function setupTouchControls() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    if (isMobile) {
        // Player 1 controls
        const p1Up = document.getElementById('p1Up');
        const p1Down = document.getElementById('p1Down');
        const p1Release = document.getElementById('p1Release');
        
        p1Up.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player1.upPressed = true;
        });
        p1Up.addEventListener('touchend', (e) => {
            e.preventDefault();
            player1.upPressed = false;
        });
        
        p1Down.addEventListener('touchstart', (e) => {
            e.preventDefault();
            player1.downPressed = true;
        });
        p1Down.addEventListener('touchend', (e) => {
            e.preventDefault();
            player1.downPressed = false;
        });
        
        p1Release.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (ballStuckToPlayer === 1) {
                releaseBall(1);
            }
        });
        
        // Player 2 controls (only for two-player mode)
        const p2Up = document.getElementById('p2Up');
        const p2Down = document.getElementById('p2Down');
        const p2Release = document.getElementById('p2Release');
        
        p2Up.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameMode === 'two') player2.upPressed = true;
        });
        p2Up.addEventListener('touchend', (e) => {
            e.preventDefault();
            player2.upPressed = false;
        });
        
        p2Down.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameMode === 'two') player2.downPressed = true;
        });
        p2Down.addEventListener('touchend', (e) => {
            e.preventDefault();
            player2.downPressed = false;
        });
        
        p2Release.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (ballStuckToPlayer === 2 && gameMode === 'two') {
                releaseBall(2);
            }
        });
    }
}

// Initialize when DOM is loaded
canvas = document.getElementById('pongCanvas');
ctx = canvas.getContext('2d');

window.addEventListener('resize', () => {
    if (gameRunning) {
        resizeCanvas();
    }
});

setupTouchControls();
showMenu();
