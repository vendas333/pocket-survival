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
    anim('slime-move', ['slime0', 'slime1'], 4);
    anim('bat-move', ['bat0', 'bat1'], 10);
    anim('skeleton-move', ['skeleton0', 'skeleton1'], 6);
    anim('golem-move', ['golem0', 'golem1'], 3);

    this.scene.start('Menu');
  }
}
