import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './config.js';
import { initPWA } from './pwa.js';
import { BootScene } from './scenes/BootScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { GameScene } from './scenes/GameScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { UIScene } from './scenes/UIScene.js';

initPWA();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1c2c',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  input: { activePointers: 3 },
  scene: [BootScene, MenuScene, GameScene, UIScene, GameOverScene],
});

// Handy for debugging in the browser console.
window.__game = game;
