const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let jumpSound;
let music;
let obstacles;
let background;
let isGameRunning = false;
let isGameOver = false;
let score = 0;
let highScore = 0;
let scoreText;
let highScoreText;
let gameOverText;
let restartText;

function preload() {
    // Load player as spritesheet (6 frames: 4 run + 1 jump + 1 fall)
    // Image size: 673x371, so each frame is 673/6 ≈ 112 width
    this.load.spritesheet('player', 'assets/player.png', {
        frameWidth: 112,  // 673 / 6 ≈ 112
        frameHeight: 371
    });
    this.load.audio('jump', 'assets/jump.wav');
    this.load.audio('music', 'assets/game-music-loop-18-153392.mp3');
}

function create() {
    // Load high score from localStorage
    highScore = localStorage.getItem('highScore') || 0;
    highScore = parseInt(highScore);

    // 1. Background
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x2d2d2d);
    graphics.fillRect(0, 0, 800, 600);
    graphics.fillStyle(0x555555);
    for (let i = 0; i < 100; i++) {
        graphics.fillRect(Math.random() * 800, Math.random() * 600, 2, 2);
    }
    graphics.generateTexture('starfield', 800, 600);
    background = this.add.tileSprite(400, 300, 800, 600, 'starfield');

    // 2. Player Setup
    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    player.setScale(0.45);  // Increased from 0.15 to 0.25 for better visibility
    player.refreshBody();

    // 3. Create Animations
    // Run animation: frames 0-3
    this.anims.create({
        key: 'run',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    // Jump animation: frame 4
    this.anims.create({
        key: 'jump',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 10
    });

    // Fall animation: frame 5
    this.anims.create({
        key: 'fall',
        frames: [{ key: 'player', frame: 5 }],
        frameRate: 10
    });

    // Start with run animation
    player.anims.play('run', true);

    // 4. Input
    cursors = this.input.keyboard.createCursorKeys();
    jumpSound = this.sound.add('jump');
    music = this.sound.add('music');

    // 4. Obstacles
    obstacles = this.physics.add.group();

    // 5. Collision Detection
    this.physics.add.overlap(player, obstacles, hitObstacle, null, this);

    // 6. UI - Score Display
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial'
    });

    highScoreText = this.add.text(16, 48, 'Hi-Score: ' + highScore, {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Arial'
    });

    // 7. Game Over Text (hidden initially)
    gameOverText = this.add.text(400, 250, 'GAME OVER', {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Arial'
    }).setOrigin(0.5).setVisible(false);

    restartText = this.add.text(400, 320, 'Press SPACE to Restart', {
        fontSize: '24px',
        fill: '#fff',
        fontFamily: 'Arial'
    }).setOrigin(0.5).setVisible(false);

    // 8. Click to Start Overlay
    const startText = this.add.text(400, 300, 'CLICK TO START', {
        fontSize: '32px',
        fill: '#fff',
        fontFamily: 'Arial'
    }).setOrigin(0.5);

    this.input.on('pointerdown', () => {
        if (!isGameRunning && !isGameOver) {
            startGame.call(this);
            startText.setVisible(false);
        }
    });
}

function update() {
    if (!isGameRunning) return;

    // Scroll background
    background.tilePositionX += 5;

    // Jump Logic
    if (cursors.space.isDown && player.body.onFloor() && !isGameOver) {
        player.setVelocityY(-500);
        jumpSound.play();
    }

    // Animation Logic (based on player state)
    if (!isGameOver) {
        if (player.body.velocity.y < 0) {
            // Going up - play jump animation
            player.anims.play('jump', true);
        } else if (player.body.velocity.y > 0 && !player.body.onFloor()) {
            // Falling down - play fall animation
            player.anims.play('fall', true);
        } else if (player.body.onFloor()) {
            // On ground - play run animation
            player.anims.play('run', true);
        }
    }

    // Restart Logic
    if (isGameOver && cursors.space.isDown) {
        restartGame.call(this);
    }

    // Obstacle Cleanup
    obstacles.children.iterate(function (obstacle) {
        if (obstacle && obstacle.x < -50) {
            obstacle.destroy();
        }
    });

    // Score Update (only when alive)
    if (!isGameOver) {
        score += 1;
        scoreText.setText('Score: ' + score);

        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreText.setText('Hi-Score: ' + highScore);
        }
    }
}

function startGame() {
    isGameRunning = true;
    isGameOver = false;
    score = 0;
    music.play({ loop: true, volume: 0.5 });

    // Start obstacle spawning
    this.time.addEvent({
        delay: 2000,
        callback: spawnObstacle,
        callbackScope: this,
        loop: true
    });
}

function spawnObstacle() {
    if (!isGameRunning || isGameOver) return;

    if (!this.textures.exists('obstacle')) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 30, 50);
        graphics.generateTexture('obstacle', 30, 50);
    }

    const obstacle = obstacles.create(850, 575, 'obstacle');
    obstacle.setVelocityX(-300);
    obstacle.setImmovable(true);
    obstacle.body.allowGravity = false;
}

function hitObstacle(player, obstacle) {
    if (isGameOver) return;

    // Game Over!
    isGameOver = true;
    this.physics.pause();
    player.setTint(0xff0000); // Red tint on death
    player.anims.stop(); // Stop animation on death

    // Save high score
    localStorage.setItem('highScore', highScore);

    // Show Game Over UI
    gameOverText.setVisible(true);
    restartText.setVisible(true);

    // Stop music
    music.stop();
}

function restartGame() {
    // Reset game state
    isGameOver = false;
    isGameRunning = false;
    score = 0;

    // Restart the scene (Phaser 3 API)
    this.scene.restart();
}
