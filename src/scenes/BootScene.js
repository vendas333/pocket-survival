import Phaser from 'phaser';
import { SPRITE_SCALE } from '../config.js';
import { createSpriteTextures } from '../gfx/sprites.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    createSpriteTextures(this, SPRITE_SCALE);

    const anim = (key, frames, frameRate) =>
      this.anims.create({ key, frames: frames.map((f) => ({ key: f })), frameRate, repeat: -1 });
    anim('player-walk', ['player0', 'player1'], 8);
    anim('player-idle', ['player0'], 1);
    anim('zombie-move', ['zombie0', 'zombie1'], 3);
    anim('runner-move', ['runner0', 'runner1'], 9);
    anim('brute-move', ['brute0', 'brute1'], 2);

    this.scene.start('Menu');
  }
}
