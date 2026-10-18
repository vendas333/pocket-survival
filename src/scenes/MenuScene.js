import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { isMuted, toggleMute, unlockAudio } from '../audio/sfx.js';
import { getHighScore } from '../logic/storage.js';
import { canPromptInstall, isIOS, isStandalone, onInstallAvailabilityChange, promptInstall } from '../pwa.js';
import { makeButton, pixelText } from '../ui/widgets.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'ground').setOrigin(0);

    // Decorative scenery
    const deco = [
      ['tree', 40, 120], ['tree', 320, 90], ['tree', 300, 560], ['tree', 60, 590],
      ['rock', 300, 300], ['bush', 70, 300], ['flower', 120, 520], ['flower2', 250, 470],
    ];
    deco.forEach(([key, x, y]) => this.add.image(x, y, key).setOrigin(0.5, 1));

    const title = pixelText(this, cx, 150, 'POCKET\nSURVIVAL', 44, '#ffcd75');
    title.setLineSpacing(-6);
    this.tweens.add({ targets: title, y: 158, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pixelText(this, cx, 232, 'survive the night forest', 13, '#a7f070');

    const hero = this.add.sprite(cx - 30, 330, 'player0').play('player-walk').setScale(1.4);
    const slime = this.add.sprite(cx + 40, 336, 'slime0').play('slime-move').setScale(1.4);
    this.tweens.add({ targets: [hero, slime], x: '+=10', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const best = getHighScore();
    pixelText(this, cx, 392, best > 0 ? `BEST  ${best}` : 'NO RECORD YET', 18);

    makeButton(this, cx, 455, 200, 54, 'PLAY', () => this.startGame(), { fontSize: 24 });

    const muteBtn = makeButton(this, cx - 55, 525, 100, 40, isMuted() ? 'SOUND OFF' : 'SOUND ON', () => {
      muteBtn.setLabel(toggleMute() ? 'SOUND OFF' : 'SOUND ON');
    }, { fontSize: 12, color: 0x3b5dc9 });

    const installBtn = makeButton(this, cx + 55, 525, 100, 40, 'INSTALL', async () => {
      if (canPromptInstall()) {
        await promptInstall();
      } else if (isIOS()) {
        this.showIOSHint();
      }
    }, { fontSize: 12, color: 0xef7d57 });

    const refreshInstall = () => {
      const available = !isStandalone() && (canPromptInstall() || isIOS());
      installBtn.setVisible(available);
      muteBtn.setX(available ? cx - 55 : cx);
    };
    refreshInstall();
    const unsubscribe = onInstallAvailabilityChange(refreshInstall);
    this.events.once('shutdown', unsubscribe);

    pixelText(this, cx, 600, 'Move: drag / WASD   Shoot: automatic', 10, '#94b0c2');

    this.input.keyboard?.once('keydown-ENTER', () => this.startGame());
    this.input.keyboard?.once('keydown-SPACE', () => this.startGame());
  }

  showIOSHint() {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1c2c, 0.85).setInteractive();
    const text = pixelText(this, cx, GAME_HEIGHT / 2 - 40,
      'To install on iPhone:\n\n1. Tap the Share button\n2. "Add to Home Screen"\n\n(tap to close)', 15);
    bg.once('pointerup', () => {
      bg.destroy();
      text.destroy();
    });
  }

  startGame() {
    unlockAudio();
    this.scene.start('Game');
  }
}
