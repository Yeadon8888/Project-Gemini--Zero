import GameScene from './scenes/GameScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false  // Enable to see collision boxes
        }
    },
    scene: [MainMenuScene, GameScene]
};

const game = new Phaser.Game(config);
