import Player from '../objects/Player.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Load player as spritesheet (6 frames)
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 928,
            frameHeight: 3072
        });

        // Load monsters (3 types: demon, dragon, slime)
        // Each frame is 5568/3 = 1856 width
        this.load.spritesheet('monsters', 'assets/Monster.png', {
            frameWidth: 1856,
            frameHeight: 3072
        });

        this.load.audio('jump', 'assets/jump.wav');
        this.load.audio('hit', 'assets/hit.wav');
        this.load.audio('music', 'assets/game-music-loop-18-153392.mp3');
    }

    create() {
        // Data
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore') || 0);
        this.isGameRunning = false;
        this.isGameOver = false;

        // Attack system
        this.attackCharges = 5; // Max 5 attacks
        this.maxAttackCharges = 5;
        this.lastAttackRechargeTime = 0;
        this.attackRechargeDelay = 3000; // 3 seconds to recharge 1 attack

        // Monster speed progression
        this.monsterSpeed = -300;
        this.speedIncreaseInterval = 10; // Increase speed every 10 seconds

        // 1. Background (Generated)
        this.createBackground();

        // 2. Ground (The "True Floor")
        this.createGround();

        // 3. Particles
        this.createParticles();

        // 4. Player
        // new Player(scene, X坐标, Y坐标)
        // Y坐标: 数值越小=越靠上, 数值越大=越靠下
        // 当前Y=620，接近地面Y=670 (确保玩家能站在地上)
        this.player = new Player(this, 100, 500);
        // Collide with Ground instead of World Bounds
        this.physics.add.collider(this.player, this.ground);

        // 5. Obstacles
        this.obstacles = this.physics.add.group();
        this.physics.add.collider(this.obstacles, this.ground);
        this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);

        // 6. UI
        this.createUI();

        // 7. Music
        this.music = this.sound.add('music', { loop: true, volume: 0.5 });

        // 8. Input
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.isGameOver) {
                this.scene.restart();
            }
        });

        // Attack Input (Z key)
        this.zKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    }

    createGround() {
        this.ground = this.physics.add.staticGroup();

        // ========== 地面高度调整 ==========
        // this.add.rectangle(X, Y, 宽度, 高度, 颜色, 透明度)
        // Y坐标: 数值越小=地面越高, 数值越大=地面越低
        // 当前Y=600，让玩家站得更高（原来是670）
        const groundBlock = this.add.rectangle(400, 600, 800, 20, 0x00ff00, 0);
        // ===================================

        this.ground.add(groundBlock);
    }

    createParticles() {
        // Dust particles (for running)
        const dustGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        dustGraphics.fillStyle(0xffffff);
        dustGraphics.fillRect(0, 0, 4, 4);
        dustGraphics.generateTexture('dust', 4, 4);

        this.dustEmitter = this.add.particles(0, 0, 'dust', {
            lifespan: 300,
            speedX: { min: -100, max: -50 },
            speedY: { min: -50, max: 0 },
            scale: { start: 1, end: 0 },
            quantity: 1,
            emitting: false
        });

        // Explosion particles (for destroying obstacles)
        const explosionGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        explosionGraphics.fillStyle(0xff4400);
        explosionGraphics.fillRect(0, 0, 8, 8);
        explosionGraphics.generateTexture('explosion', 8, 8);

        this.explosionEmitter = this.add.particles(0, 0, 'explosion', {
            lifespan: 500,
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            quantity: 20,
            emitting: false
        });
    }

    checkAttackHit() {
        // Simple hitbox check: Destroy obstacles in front of player
        const attackRange = 150;
        const playerX = this.player.x;
        const playerY = this.player.y;

        this.obstacles.children.iterate((obstacle) => {
            if (obstacle && obstacle.active) {
                const dist = Phaser.Math.Distance.Between(playerX, playerY, obstacle.x, obstacle.y);
                if (dist < attackRange && obstacle.x > playerX) {
                    // Hit!
                    this.destroyObstacle(obstacle);
                }
            }
        });
    }

    destroyObstacle(obstacle) {
        // Play explosion effect
        this.explosionEmitter.emitParticleAt(obstacle.x, obstacle.y);

        // Destroy object
        obstacle.destroy();

        // Bonus Score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        // Sound effect (reuse jump for now with different pitch)
        this.sound.play('jump', { detune: -1200 });
    }

    createBackground() {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x2d2d2d);
        graphics.fillRect(0, 0, 800, 600);
        graphics.fillStyle(0x555555);
        for (let i = 0; i < 100; i++) {
            graphics.fillRect(Math.random() * 800, Math.random() * 600, 2, 2);
        }
        graphics.generateTexture('starfield', 800, 600);
        this.background = this.add.tileSprite(400, 300, 800, 600, 'starfield');
    }

    createUI() {
        // Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' });
        this.highScoreText = this.add.text(16, 48, 'Hi-Score: ' + this.highScore, { fontSize: '24px', fill: '#ffff00' });

        // Attack charges display
        this.attackText = this.add.text(16, 80, '⚔ Attacks: 5/5', { fontSize: '20px', fill: '#00ff00' });

        // Start Overlay
        this.startText = this.add.text(400, 300, 'CLICK TO START', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);

        // Game Over Overlay
        this.gameOverText = this.add.text(400, 250, 'GAME OVER', { fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5).setVisible(false);
        this.restartText = this.add.text(400, 320, 'Press SPACE to Restart', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setVisible(false);

        // Controls instruction (Bottom Right)
        const controlsText = [
            'Controls:',
            'SPACE - Jump (Double Jump)',
            'Z - Attack'
        ].join('\n');
        this.add.text(800 - 16, 600 - 16, controlsText, {
            fontSize: '16px',
            fill: '#888',
            align: 'right',
            fontFamily: 'monospace'
        }).setOrigin(1, 1);

        // Click to Start
        this.input.on('pointerdown', () => {
            if (!this.isGameRunning && !this.isGameOver) {
                this.startGame();
            }
        });
    }

    startGame() {
        this.isGameRunning = true;
        this.startText.setVisible(false);
        this.music.play();

        // Reset attack charges
        this.attackCharges = this.maxAttackCharges;
        this.lastAttackRechargeTime = this.time.now;
        this.updateAttackUI();

        // ========== 动态难度系统 ==========
        // 初始生成间隔2秒，随分数递减
        this.spawnDelay = 2000;
        this.minSpawnDelay = 800;  // 最短间隔0.8秒

        // Spawn Timer - 使用动态间隔
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnObstacle,
            callbackScope: this,
            loop: true
        });
        // ===================================
    }

    update() {
        if (!this.isGameRunning) return;

        // Check Z key for attack
        if (Phaser.Input.Keyboard.JustDown(this.zKey) && !this.isGameOver) {
            try {
                console.log('Z pressed! Charges:', this.attackCharges);
                if (this.attackCharges > 0) {
                    this.player.attack();
                    this.attackCharges--;
                    this.lastAttackRechargeTime = this.time.now;
                    this.updateAttackUI();
                    this.checkAttackHit();

                    // Play hit sound (with error handling)
                    if (this.sound.get('hit')) {
                        this.sound.play('hit');
                    }
                }
            } catch (error) {
                console.error('Attack failed:', error);
            }
        }

        // Scroll Background
        this.background.tilePositionX += 5;

        // Update Player
        this.player.update();

        // Update Obstacles
        this.obstacles.children.iterate((obstacle) => {
            if (obstacle && obstacle.x < -50) {
                obstacle.destroy();
            }
        });

        // Score
        if (!this.isGameOver) {
            this.score += 1;
            this.scoreText.setText('Score: ' + this.score);
            if (this.score > this.highScore) {
                this.highScore = this.score;
                this.highScoreText.setText('Hi-Score: ' + this.highScore);
            }

            // ========== 动态难度调整 ==========
            // 每1000分，怪物生成间隔减少150ms (更平滑的难度提升)
            if (this.score % 1000 === 0 && this.score > 0) {
                this.spawnDelay = Math.max(this.minSpawnDelay, this.spawnDelay - 150);
                this.spawnTimer.delay = this.spawnDelay;
                console.log(`难度提升！生成间隔: ${this.spawnDelay}ms`);
            }
            // ===================================

            // Recharge attack
            if (this.attackCharges < this.maxAttackCharges) {
                if (this.time.now - this.lastAttackRechargeTime > this.attackRechargeDelay) {
                    this.attackCharges++;
                    this.lastAttackRechargeTime = this.time.now;
                    this.updateAttackUI();
                }
            }

            // Increase monster speed over time
            if (this.score % (this.speedIncreaseInterval * 60) === 0 && this.score > 0) {
                this.monsterSpeed -= 20; // Increase speed
            }
        }
    }

    updateAttackUI() {
        const color = this.attackCharges === 0 ? '#ff0000' : (this.attackCharges < 3 ? '#ffaa00' : '#00ff00');
        this.attackText.setText(`⚔ Attacks: ${this.attackCharges}/${this.maxAttackCharges}`);
        this.attackText.setColor(color);
    }

    spawnObstacle() {
        if (!this.isGameRunning || this.isGameOver) return;

        // ========== 防止怪物堆叠 ==========
        // 检查最右侧怪物的位置和类型
        let rightmostX = 0;
        let rightmostType = null;
        this.obstacles.children.iterate((child) => {
            if (child && child.active && child.x > rightmostX) {
                rightmostX = child.x;
                rightmostType = child.getData('monsterType');
            }
        });

        // 先选择怪物类型
        // 0 = Demon (ground), 1 = Dragon (flying), 2 = Slime (ground)
        const monsterType = Phaser.Math.Between(0, 2);

        // 智能间距：如果新怪物和上一个怪物高度不同，可以更近
        let minSafeDistance;
        const isNewMonsterFlying = (monsterType === 1);
        const isLastMonsterFlying = (rightmostType === 1);

        if (rightmostType !== null && isNewMonsterFlying !== isLastMonsterFlying) {
            // 一个飞行一个地面，可以更近
            minSafeDistance = 250;
        } else {
            // 同类型怪物，保持较长间距
            minSafeDistance = 500;
        }

        // 如果最右侧怪物距离生成点太近，跳过本次生成
        if (rightmostX > 800 - minSafeDistance) {
            return; // 不生成，等下一个周期
        }
        // ===================================

        // Different Y positions for different monsters
        let yPos = 550; // Default ground level (Moved up from 625 to show full body)
        if (monsterType === 1) {
            // Dragon can fly at different heights
            yPos = Phaser.Math.Between(350, 450); // Higher for flying
        }

        const monster = this.obstacles.create(850, yPos, 'monsters', monsterType);
        monster.setVelocityX(this.monsterSpeed);
        monster.setImmovable(true);
        monster.body.allowGravity = false;

        // Scale down the huge monster
        monster.setScale(0.06);

        // FLIP HORIZONTAL to face the player (mirror)
        monster.setFlipX(true);

        // Adjust hitbox based on monster type
        // Make hitboxes MUCH smaller for easier gameplay
        if (monsterType === 0) {
            // Demon - small core hitbox
            monster.body.setSize(monster.width * 0.25, monster.height * 0.35);
            monster.body.setOffset(monster.width * 0.35, monster.height * 0.35);
        } else if (monsterType === 1) {
            // Dragon - small core hitbox
            monster.body.setSize(monster.width * 0.3, monster.height * 0.35);
            monster.body.setOffset(monster.width * 0.35, monster.height * 0.3);
        } else {
            // Slime - small core hitbox
            monster.body.setSize(monster.width * 0.3, monster.height * 0.3);
            monster.body.setOffset(monster.width * 0.35, monster.height * 0.4);
        }

        // Store type for later reference
        monster.setData('monsterType', monsterType);
    }

    hitObstacle(player, obstacle) {
        if (this.isGameOver) return;

        // More accurate collision check using actual body boundaries
        const playerBottom = player.body.bottom;
        const obstacleTop = obstacle.body.top;

        // If player's feet are above the obstacle's head by at least 20px, it's a clean jump
        if (playerBottom < obstacleTop - 20) {
            // Player successfully jumped over!
            return;
        }

        // Collision detected - Game Over!
        this.isGameOver = true;
        this.player.die();

        localStorage.setItem('highScore', this.highScore);

        this.gameOverText.setVisible(true);
        this.restartText.setVisible(true);
        this.music.stop();
    }
}
