export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    preload() {
        // 复用 GameScene 的资源，或者加载新的菜单资源
        // 这里假设资源在 GameScene 中加载，但通常最好在 BootScene 或 PreloadScene 中加载
        // 为了简单，我们在这里重新加载需要的背景资源，或者假设它们已经缓存（如果之前加载过）
        // 但由于这是第一个场景，我们需要在这里加载基础资源

        this.load.audio('music', 'assets/game-music-loop-18-153392.mp3');
        // 加载玩家图片用于装饰
        this.load.spritesheet('player', 'assets/player.png', {
            frameWidth: 928,
            frameHeight: 3072
        });
        // 加载怪物资源用于装饰
        this.load.spritesheet('monsters', 'assets/Monster.png', {
            frameWidth: 1856,
            frameHeight: 3072
        });
    }

    create() {
        // 1. 动态星空背景
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x1a1a2e); // 深蓝色背景
        graphics.fillRect(0, 0, 800, 600);
        graphics.generateTexture('menu_bg', 800, 600);
        this.add.image(400, 300, 'menu_bg');

        // 星星粒子效果
        const starGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        starGraphics.fillStyle(0xffffff);
        starGraphics.fillCircle(2, 2, 2);
        starGraphics.generateTexture('star', 4, 4);

        this.add.particles(0, 0, 'star', {
            x: { min: 0, max: 800 },
            y: { min: 0, max: 600 },
            quantity: 2,
            frequency: 100,
            lifespan: 4000,
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            speedY: { min: -20, max: -50 } // 向上飘动
        });

        // 2. 游戏标题 "Gemini-zero"
        const title = this.add.text(400, 200, 'GEMINI-ZERO', {
            fontFamily: 'Arial Black',
            fontSize: '72px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 8,
            shadow: { offsetX: 4, offsetY: 4, color: '#ff00ff', blur: 10, stroke: true, fill: true }
        }).setOrigin(0.5);

        // 标题动画：上下浮动 + 颜色渐变
        this.tweens.add({
            targets: title,
            y: 190,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 3. 作者信息 "Created by Yeadon"
        this.add.text(400, 280, 'Created by Yeadon', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#aaaaaa',
            fontStyle: 'italic'
        }).setOrigin(0.5);

        // 4. 开始按钮
        const startButton = this.add.text(400, 400, 'START GAME', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#ff0055',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                startButton.setStyle({ fill: '#ffff00', backgroundColor: '#ff2277' });
                startButton.setScale(1.1);
            })
            .on('pointerout', () => {
                startButton.setStyle({ fill: '#ffffff', backgroundColor: '#ff0055' });
                startButton.setScale(1);
            })
            .on('pointerdown', () => {
                this.startGame();
            });

        // 按钮呼吸动画
        this.tweens.add({
            targets: startButton,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 5. 装饰性玩家动画
        // 需要先创建动画（如果还没创建）
        if (!this.anims.exists('run')) {
            this.anims.create({
                key: 'run',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        const decorPlayer = this.add.sprite(150, 500, 'player');
        decorPlayer.setScale(0.15); // 缩小一点，不遮挡
        decorPlayer.play('run');

        // 6. 装饰性怪物动画 (右下角)
        const decorMonster = this.add.sprite(650, 450, 'monsters', 1); // 1 = Dragon
        decorMonster.setScale(0.15);
        decorMonster.setFlipX(true); // 面向左边

        // 让怪物上下浮动
        this.tweens.add({
            targets: decorMonster,
            y: 430,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 播放背景音乐（如果还没播放）
        if (!this.sound.get('music')) {
            this.sound.play('music', { loop: true, volume: 0.5 });
        } else if (!this.sound.get('music').isPlaying) {
            this.sound.get('music').play();
        }
    }

    startGame() {
        // 切换到游戏场景
        this.scene.start('GameScene');
    }
}
