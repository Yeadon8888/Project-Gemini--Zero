export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'player');

        // Add to scene and physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Physics Config
        // this.setCollideWorldBounds(true); // Removed: We now collide with custom Ground
        this.setCollideWorldBounds(false); // Explicitly disable
        // New image is HUGE (3072px height), so we need a tiny scale to fit 600px screen
        // Target height ~100px -> 0.03 scale? Let's try 0.05 first.
        this.setScale(0.07);

        // ==================== COLLISION BOX TUNING ====================
        // 您可以自己调整以下4个数值：

        const boxWidthPercent = 0.3;   // 碰撞箱宽度 (0.0-1.0, 当前30%)
        const boxHeightPercent = 0.3;  // 碰撞箱高度 (0.0-1.0, 当前30%)
        const offsetXPercent = 0.35;   // 水平偏移 (越大越靠右, 当前35%)
        const offsetYPercent = 0.4;   // 垂直偏移 (越大越靠下, 当前45%)

        this.body.setSize(
            this.width * boxWidthPercent,
            this.height * boxHeightPercent
        );
        this.body.setOffset(
            this.width * offsetXPercent,
            this.height * offsetYPercent
        );
        // ===============================================================
        // Mechanics
        this.jumpForce = -800;
        this.gravity = 1800;
        this.body.setGravityY(this.gravity);

        this.canDoubleJump = false;
        this.isDead = false;
        this.isAttacking = false;

        // Input
        this.cursors = scene.input.keyboard.createCursorKeys();

        // Init Animations
        this.initAnimations(scene);
    }

    initAnimations(scene) {
        // Run
        if (!scene.anims.exists('run')) {
            scene.anims.create({
                key: 'run',
                frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1
            });
        }
        // Jump
        if (!scene.anims.exists('jump')) {
            scene.anims.create({
                key: 'jump',
                frames: [{ key: 'player', frame: 4 }],
                frameRate: 10
            });
        }
        // Fall
        if (!scene.anims.exists('fall')) {
            scene.anims.create({
                key: 'fall',
                frames: [{ key: 'player', frame: 5 }],
                frameRate: 10
            });
        }
        // Attack (Reuse Jump frame for now if no attack frame)
        // Ideally frame 6 if it existed. We'll use Jump frame with a tween maybe?
        // Or just play Jump animation for now.
    }

    update() {
        if (this.isDead) return;

        const onFloor = this.body.touching.down; // Check collision with ground object

        // Jump Logic
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            if (onFloor) {
                this.setVelocityY(this.jumpForce);
                this.scene.sound.play('jump');
                this.canDoubleJump = true;

                // Dust effect on jump
                this.scene.dustEmitter.emitParticleAt(this.x, this.y + 25);
            } else if (this.canDoubleJump) {
                // Double Jump
                this.setVelocityY(this.jumpForce * 0.8); // Slightly weaker second jump
                this.scene.sound.play('jump', { detune: 600 }); // Higher pitch for 2nd jump
                this.canDoubleJump = false;

                // Optional: Add a spin or visual effect here later
            }
        }

        // Animation State Machine
        if (this.isAttacking) {
            // Keep attack pose (using Jump frame as placeholder)
            this.anims.play('jump', true);
        } else if (this.body.velocity.y < 0) {
            this.anims.play('jump', true);
        } else if (this.body.velocity.y > 0 && !onFloor) {
            this.anims.play('fall', true);
        } else if (onFloor) {
            this.anims.play('run', true);

            // Emit dust while running
            if (this.scene.time.now % 200 < 20) { // Every ~200ms
                this.scene.dustEmitter.emitParticleAt(this.x - 20, this.y + 25);
            }
        }
    }

    attack() {
        try {
            this.isAttacking = true;

            // Visual feedback: Flash effect
            this.scene.tweens.add({
                targets: this,
                alpha: 0.5,
                duration: 50,
                yoyo: true,
                onComplete: () => {
                    this.isAttacking = false;
                }
            });

            // Beautiful Slash Effect - Arc from top-right to bottom-right
            const slash = this.scene.add.graphics();

            // Outer glow (cyan/blue)
            slash.lineStyle(10, 0x00ddff, 0.3);
            slash.arc(this.x + 40, this.y, 60, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
            slash.strokePath();

            // Middle layer (white)
            slash.lineStyle(6, 0xffffff, 0.8);
            slash.arc(this.x + 40, this.y, 60, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
            slash.strokePath();

            // Inner bright core (yellow-white)
            slash.lineStyle(3, 0xffffcc, 1);
            slash.arc(this.x + 40, this.y, 60, Phaser.Math.DegToRad(-60), Phaser.Math.DegToRad(60), false);
            slash.strokePath();

            // Fade out
            this.scene.tweens.add({
                targets: slash,
                alpha: 0,
                duration: 250,
                onComplete: () => {
                    slash.destroy();
                }
            });
        } catch (error) {
            console.error('Attack error:', error);
            this.isAttacking = false;
        }
    }

    die() {
        this.isDead = true;
        this.setTint(0xff0000);
        this.anims.stop();
        this.body.setVelocity(0, 0);
        this.scene.physics.pause();
    }
}
