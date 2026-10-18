import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { sfx } from '../audio/sfx.js';
import { buyMeta, loadMeta, META_ORDER, META_UPGRADES, metaCost, saveMeta } from '../logic/meta.js';
import { drawPanel, makeButton, pixelText } from '../ui/widgets.js';

// Permanent upgrades shop (souls are kept between runs)
export class MetaScene extends Phaser.Scene {
  constructor() {
    super('Meta');
  }

  create() {
    const cx = GAME_WIDTH / 2;
    this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'ground').setOrigin(0);
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0e060a, 0.55).setOrigin(0);
    const g = this.add.graphics();
    drawPanel(g, 14, 40, GAME_WIDTH - 28, 560, 0x1a1c2c);

    pixelText(this, cx, 72, 'SOUL ALTAR', 26, '#b13e53');
    pixelText(this, cx, 98, 'Permanent upgrades - kept forever', 10, '#94b0c2');
    this.soulText = pixelText(this, cx, 126, '', 18, '#d9d0c1');

    const rowH = 64;
    this.rows = META_ORDER.map((id, i) => {
      const def = META_UPGRADES[id];
      const y = 176 + i * rowH;
      this.add.rectangle(cx, y, GAME_WIDTH - 48, rowH - 8, 0x29366f, 0.5);
      this.add.image(42, y, def.icon).setScale(1.2);
      const name = pixelText(this, 64, y - 14, '', 13).setOrigin(0, 0.5);
      pixelText(this, 64, y + 4, def.desc, 10, '#94b0c2').setOrigin(0, 0.5);
      const cost = pixelText(this, 64, y + 20, '', 10, '#ff6b6b').setOrigin(0, 0.5);
      const btn = makeButton(this, GAME_WIDTH - 68, y, 78, 38, 'BUY', () => this.buy(id), { color: 0xb13e53, fontSize: 13 });
      return { id, def, name, cost, btn };
    });

    makeButton(this, cx, GAME_HEIGHT - 70, 180, 46, 'BACK', () => this.scene.start('Menu'), { color: 0x3b5dc9 });
    this.input.keyboard?.once('keydown-ESC', () => this.scene.start('Menu'));
    this.refresh();
  }

  buy(id) {
    const next = buyMeta(loadMeta(), id);
    if (!next) return;
    saveMeta(next);
    sfx.upgrade();
    this.cameras.main.flash(150, 177, 62, 83);
    this.refresh();
  }

  refresh() {
    const meta = loadMeta();
    this.soulText.setText(`SOULS  ${meta.souls}`);
    for (const row of this.rows) {
      const level = meta.levels[row.id] ?? 0;
      const cost = metaCost(row.id, level);
      row.name.setText(`${row.def.name}  ${'■'.repeat(level)}${'□'.repeat(row.def.maxLevel - level)}`);
      if (cost === null) {
        row.cost.setText('MAXED').setColor('#a7f070');
        row.btn.setLabel('MAX').setEnabled(false);
      } else {
        row.cost.setText(`${cost} souls`).setColor('#ff6b6b');
        row.btn.setLabel('BUY').setEnabled(meta.souls >= cost);
      }
    }
  }
}
