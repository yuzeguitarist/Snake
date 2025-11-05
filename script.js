// ========================================
// 贪吃蛇游戏
// ========================================

class SnakeGame {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // Game state
        this.gameState = 'idle'; // idle, playing, paused, gameover
        this.gridSize = 20;
        this.tileCount = 20;
        this.tileSize = 0;

        // Snake
        this.snake = [];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        // Food
        this.food = { x: 0, y: 0 };

        // Score
        this.score = 0;
        this.highScore = this.loadHighScore();

        // Game speed - 降低PC端速度
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.gameSpeed = this.isMobile ? 120 : 180; // PC端速度更慢
        this.lastFrameTime = 0;

        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;

        // UI elements
        this.scoreElement = document.querySelector('.score');
        this.highScoreElement = document.querySelector('.high-score');
        this.overlay = document.getElementById('gameOverlay');
        this.overlayTitle = document.getElementById('overlayTitle');
        this.overlayMessage = document.getElementById('overlayMessage');
        this.startButton = document.getElementById('startButton');

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.updateScoreDisplay();
        window.requestAnimationFrame((time) => this.gameLoop(time));
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        this.canvas.width = size;
        this.canvas.height = size;
        this.tileSize = size / this.tileCount;
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Start button
        this.startButton.addEventListener('click', () => this.startGame());

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });

        // Window resize
        window.addEventListener('resize', () => this.setupCanvas());
    }

    // Game Controls
    handleKeyPress(e) {
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.gameState === 'idle' || this.gameState === 'gameover') {
                this.startGame();
            } else if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
            return;
        }

        if (this.gameState !== 'playing') return;

        // Direction controls
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: -1 };
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                if (this.direction.y === 0) {
                    this.nextDirection = { x: 0, y: 1 };
                }
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                if (this.direction.x === 0) {
                    this.nextDirection = { x: -1, y: 0 };
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                if (this.direction.x === 0) {
                    this.nextDirection = { x: 1, y: 0 };
                }
                break;
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchStartX || !this.touchStartY) return;
        if (this.gameState !== 'playing') return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 30 && this.direction.x === 0) {
                this.nextDirection = { x: 1, y: 0 };
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            } else if (deltaX < -30 && this.direction.x === 0) {
                this.nextDirection = { x: -1, y: 0 };
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }
        } else {
            // Vertical swipe
            if (deltaY > 30 && this.direction.y === 0) {
                this.nextDirection = { x: 0, y: 1 };
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            } else if (deltaY < -30 && this.direction.y === 0) {
                this.nextDirection = { x: 0, y: -1 };
                this.touchStartX = touch.clientX;
                this.touchStartY = touch.clientY;
            }
        }
    }

    // Game State Management
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = this.isMobile ? 120 : 180; // 重置初始速度
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        // Initialize snake in the middle
        const mid = Math.floor(this.tileCount / 2);
        this.snake = [
            { x: mid, y: mid },
            { x: mid - 1, y: mid },
            { x: mid - 2, y: mid }
        ];

        this.generateFood();
        this.updateScoreDisplay();
        this.hideOverlay();
    }

    pauseGame() {
        this.gameState = 'paused';
        this.showOverlay('暂停', '按空格键继续');
    }

    resumeGame() {
        this.gameState = 'playing';
        this.hideOverlay();
    }

    gameOver() {
        this.gameState = 'gameover';

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore();
            this.updateScoreDisplay();
            this.showOverlay('游戏结束', `新纪录：${this.score} 分！`);
        } else {
            this.showOverlay('游戏结束', `得分：${this.score} 分`);
        }
    }

    // UI Updates
    showOverlay(title, message) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.classList.remove('hidden');
    }

    hideOverlay() {
        this.overlay.classList.add('hidden');
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
    }

    // Game Logic
    update() {
        if (this.gameState !== 'playing') return;

        // Update direction
        this.direction = { ...this.nextDirection };

        // Move snake
        const head = { ...this.snake[0] };
        head.x += this.direction.x;
        head.y += this.direction.y;

        // Check wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Check self collision (excluding tail since it will be removed if no food is eaten)
        if (this.snake.slice(0, -1).some(segment => segment.x === head.x && segment.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.updateScoreDisplay();
            this.generateFood();

            // Increase speed slightly - 更温和的加速
            this.gameSpeed = Math.max(this.isMobile ? 60 : 80, this.gameSpeed - 2);
        } else {
            this.snake.pop();
        }
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        this.food = newFood;
    }

    // Rendering - 优化版本，移除网格
    draw() {
        // Get CSS variables for colors
        const style = getComputedStyle(document.documentElement);
        const bgColor = style.getPropertyValue('--bg-canvas').trim();
        const snakeColor = style.getPropertyValue('--snake-color').trim();
        const foodColor = style.getPropertyValue('--food-color').trim();

        // Clear canvas - 一次性填充背景
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw snake - 批量绘制
        this.ctx.fillStyle = snakeColor;
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.tileSize;
            const y = segment.y * this.tileSize;
            const size = this.tileSize - 2;

            // 简化透明度计算
            this.ctx.globalAlpha = Math.max(0.7, 1 - (index * 0.015));
            this.ctx.fillRect(x + 1, y + 1, size, size);
        });

        this.ctx.globalAlpha = 1;

        // Draw food - 圆形食物
        const foodX = this.food.x * this.tileSize;
        const foodY = this.food.y * this.tileSize;
        const foodSize = this.tileSize - 4;

        this.ctx.fillStyle = foodColor;
        this.ctx.beginPath();
        this.ctx.arc(
            foodX + this.tileSize / 2,
            foodY + this.tileSize / 2,
            foodSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    // Game Loop - 优化版本
    gameLoop(currentTime) {
        window.requestAnimationFrame((time) => this.gameLoop(time));

        const deltaTime = currentTime - this.lastFrameTime;

        // 游戏逻辑更新
        if (deltaTime >= this.gameSpeed) {
            this.update();
            this.lastFrameTime = currentTime;
            this.draw(); // 只在逻辑更新后重绘
        }
    }

    // Local Storage
    loadHighScore() {
        const saved = localStorage.getItem('snakeHighScore');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveHighScore() {
        localStorage.setItem('snakeHighScore', this.highScore.toString());
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});
