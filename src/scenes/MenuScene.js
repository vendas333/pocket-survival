import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { isMuted, toggleMute, unlockAudio } from '../audio/sfx.js';
import { getHighScore } from '../logic/storage.js';
import { loadMeta } from '../logic/meta.js';
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
      ['rock', 300, 300], ['bush', 70, 300], ['skull', 120, 520], ['bones', 250, 470], ['grave', 300, 420], ['grave', 50, 420],
    ];
    deco.forEach(([key, x, y]) => this.add.image(x, y, key).setOrigin(0.5, 1).setTint(key === 'tree' ? 0x8c8a6e : 0xffffff));

    const title = pixelText(this, cx, 150, 'POCKET\nSURVIVAL', 44, '#d9d0c1');
    title.setLineSpacing(-6);
    this.tweens.add({ targets: title, y: 158, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    pixelText(this, cx, 232, 'the dead walk at night', 13, '#b13e53');

    const hero = this.add.sprite(cx - 30, 330, 'player0').play('player-walk').setScale(1.4);
    const slime = this.add.sprite(cx + 40, 330, 'zombie0').play('zombie-move').setScale(1.4);
    this.tweens.add({ targets: [hero, slime], x: '+=10', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const best = getHighScore();
    pixelText(this, cx, 384, best > 0 ? `BEST  ${best}` : 'NO RECORD YET', 16);

    makeButton(this, cx, 440, 200, 50, 'PLAY', () => this.startGame(), { fontSize: 24 });
    const souls = loadMeta().souls;
    const altar = makeButton(this, cx, 492, 200, 40, `SOUL ALTAR (${souls})`, () => this.scene.start('Meta'), { color: 0xb13e53, fontSize: 13 });
    if (souls > 0) this.tweens.add({ targets: altar, scale: 1.05, duration: 600, yoyo: true, repeat: -1 });

    const muteBtn = makeButton(this, cx - 55, 545, 100, 36, isMuted() ? 'SOUND OFF' : 'SOUND ON', () => {
      muteBtn.setLabel(toggleMute() ? 'SOUND OFF' : 'SOUND ON');
    }, { fontSize: 12, color: 0x3b5dc9 });

    const installBtn = makeButton(this, cx + 55, 545, 100, 36, 'INSTALL', async () => {
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
