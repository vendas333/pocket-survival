import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { getHighScore } from '../logic/storage.js';
import { drawPanel, makeButton, pixelText } from '../ui/widgets.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(result) {
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1c2c, 0.8).setOrigin(0).setInteractive();
    const g = this.add.graphics();
    drawPanel(g, 30, 130, GAME_WIDTH - 60, 430);

    pixelText(this, cx, 175, result.reason === 'camp' ? 'THE CAMP FELL' : 'YOU DIED', result.reason === 'camp' ? 30 : 38, '#b13e53');
    const time = `${Math.floor(result.seconds / 60)}:${String(result.seconds % 60).padStart(2, '0')}`;
    pixelText(this, cx, 240, `SURVIVED  ${time}`, 16);
    pixelText(this, cx, 265, `KILLS  ${result.kills}`, 16);
    const soulsLabel = pixelText(this, cx, 392, `+${result.souls ?? 0} SOULS`, 18, '#b13e53');
    this.tweens.add({ targets: soulsLabel, alpha: 0.5, duration: 500, yoyo: true, repeat: -1 });
    pixelText(this, cx, 315, `SCORE  ${result.score}`, 24, '#ffcd75');

    if (result.isNewBest) {
      const best = pixelText(this, cx, 355, 'NEW BEST!', 20, '#a7f070');
      this.tweens.add({ targets: best, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    } else {
      pixelText(this, cx, 355, `BEST  ${getHighScore()}`, 16, '#94b0c2');
    }

    makeButton(this, cx, 440, 200, 50, 'RESTART', () => this.restart(), { fontSize: 22 });
    makeButton(this, cx, 492, 200, 36, 'SOUL ALTAR', () => { this.scene.stop('Game'); this.scene.start('Meta'); }, { color: 0xb13e53, fontSize: 14 });
    makeButton(this, cx, 536, 200, 32, 'MENU', () => this.toMenu(), { color: 0x3b5dc9, fontSize: 14 });

    this.input.keyboard?.once('keydown-ENTER', () => this.restart());
    this.input.keyboard?.once('keydown-SPACE', () => this.restart());
  }

  restart() {
    this.scene.stop('Game');
    this.scene.start('Game');
  }

  toMenu() {
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
