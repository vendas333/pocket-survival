import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config.js';
import { anyAffordable, canAfford, getCost, UPGRADE_ORDER, UPGRADES } from '../logic/upgrades.js';
import { BUILD_ORDER, BUILD_RECIPES, canPay, costLabel } from '../logic/building.js';
import { drawPanel, makeButton, pixelText, VirtualJoystick } from '../ui/widgets.js';

const HUD_HEIGHT = 74;

export class UIScene extends Phaser.Scene {
  constructor() {
    super('UI');
  }

  create() {
    this.game_ = this.scene.get('Game');
    this.modal = null;
    this.input.addPointer(2); // joystick + a button at the same time

    this.joystick = new VirtualJoystick(this, { radius: 48, zoneTop: HUD_HEIGHT + 10 });
    this.createHud();
    this.createDangerOverlay();

    this.upgradeBtn = makeButton(this, GAME_WIDTH - 72, GAME_HEIGHT - 46, 120, 50, 'UPGRADE', () => this.toggleUpgrades(), {
      color: 0xef7d57,
      fontSize: 16,
    });
    makeButton(this, 72, GAME_HEIGHT - 46, 120, 50, 'BUILD', () => this.toggleBuild(), { color: 0x8a5a3b, fontSize: 16 });
    this.badge = this.add.circle(GAME_WIDTH - 18, GAME_HEIGHT - 70, 9, 0xffcd75).setStrokeStyle(3, COLORS.ink);
    this.tweens.add({ targets: this.badge, scale: 1.25, duration: 450, yoyo: true, repeat: -1 });

    this.hint = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 120, 'Gather by day. Survive the night.', 11, '#f4f4f4');
    this.tweens.add({ targets: this.hint, alpha: 0, delay: 5000, duration: 800 });
  }

  createHud() {
    const g = this.add.graphics();
    drawPanel(g, 6, 6, GAME_WIDTH - 12, HUD_HEIGHT - 12, COLORS.panelDark);

    this.add.image(22, 24, 'heart');
    this.hpBarBg = this.add.rectangle(36, 24, 104, 14, 0x333c57).setOrigin(0, 0.5).setStrokeStyle(2, COLORS.ink);
    this.hpBar = this.add.rectangle(37, 24, 102, 10, 0x38b764).setOrigin(0, 0.5);
    this.hpText = pixelText(this, 88, 24, '', 10);
    // Hunger
    this.add.image(158, 24, 'berry');
    this.add.rectangle(170, 24, 74, 14, 0x333c57).setOrigin(0, 0.5).setStrokeStyle(2, COLORS.ink);
    this.foodBar = this.add.rectangle(171, 24, 72, 10, 0xef7d57).setOrigin(0, 0.5);

    this.timeText = pixelText(this, 282, 24, '0:00', 14, '#ffcd75');

    this.add.image(22, 52, 'wood');
    this.woodText = pixelText(this, 40, 52, '0', 14).setOrigin(0, 0.5);
    this.add.image(80, 52, 'stone');
    this.stoneText = pixelText(this, 96, 52, '0', 14).setOrigin(0, 0.5);
    this.add.image(140, 52, 'beam');
    this.beamText = pixelText(this, 158, 52, '0', 14).setOrigin(0, 0.5);
    this.waveText = pixelText(this, 222, 52, 'DAY 1', 12, '#a7f070');
    this.scoreText = pixelText(this, 300, 52, '0', 14, '#f4f4f4');

    makeButton(this, GAME_WIDTH - 30, 24, 36, 30, 'II', () => this.togglePause(), { color: 0x3b5dc9, fontSize: 14 });

    // Day/night clock
    this.add.rectangle(GAME_WIDTH / 2, HUD_HEIGHT + 2, GAME_WIDTH - 12, 6, 0x1a1c2c, 0.85);
    this.phaseBar = this.add.rectangle(6, HUD_HEIGHT + 2, GAME_WIDTH - 12, 4, 0xffcd75).setOrigin(0, 0.5);
    this.phaseText = pixelText(this, GAME_WIDTH / 2, HUD_HEIGHT + 14, '', 10, '#d9d0c1');
  }

  createDangerOverlay() {
    const g = this.add.graphics().setDepth(-1);
    g.fillStyle(0xb13e53, 1);
    const t = 14;
    g.fillRect(0, 0, GAME_WIDTH, t);
    g.fillRect(0, GAME_HEIGHT - t, GAME_WIDTH, t);
    g.fillRect(0, 0, t, GAME_HEIGHT);
    g.fillRect(GAME_WIDTH - t, 0, t, GAME_HEIGHT);
    g.setAlpha(0);
    this.danger = g;
  }

  update(time) {
    const s = this.game_?.state;
    if (!s) return;
    const ratio = Phaser.Math.Clamp(s.hp / s.maxHp, 0, 1);
    this.hpBar.width = 102 * ratio;
    const food = Phaser.Math.Clamp(s.hunger / 100, 0, 1);
    this.foodBar.width = 72 * food;
    this.foodBar.fillColor = food > 0.25 ? 0xef7d57 : 0xb13e53;
    this.hpBar.fillColor = ratio > 0.5 ? 0x38b764 : ratio > 0.25 ? 0xffcd75 : 0xb13e53;
    this.hpText.setText(`${Math.ceil(s.hp)}/${s.maxHp}`);
    const seconds = Math.floor(s.elapsed / 1000);
    this.timeText.setText(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
    this.woodText.setText(String(s.wood));
    this.stoneText.setText(String(s.stone));
    this.beamText.setText(String(s.beams));
    this.waveText.setText(`${s.isNight ? 'NIGHT' : 'DAY'} ${s.wave}`).setColor(s.isNight ? '#b13e53' : '#a7f070');
    this.scoreText.setText(String(s.score));
    this.badge.setVisible(anyAffordable(this.game_.levels, s));
    const progress = Phaser.Math.Clamp(s.phaseProgress ?? 0, 0, 1);
    this.phaseBar.width = (GAME_WIDTH - 12) * (s.isNight ? 1 - progress : progress);
    this.phaseBar.fillColor = s.isNight ? (s.bloodMoon ? 0xff2a3a : 0xb13e53) : 0xffcd75;
    const left = Math.ceil(s.untilNight ?? 0);
    this.phaseText.setText(s.isNight ? (s.bloodMoon ? 'BLOOD MOON - SURVIVE UNTIL DAWN' : 'SURVIVE UNTIL DAWN') : left <= 10 ? `NIGHT IN ${left}s!` : `NIGHT IN ${left}s`);
    this.phaseText.setColor(s.isNight || left <= 10 ? '#ff6b6b' : '#d9d0c1');
    this.danger.setAlpha(ratio < 0.3 && !s.over ? 0.25 + Math.sin(time / 150) * 0.15 : 0);
  }

  // Small message under the HUD (supply drops, etc.)
  toast(text) {
    const label = pixelText(this, GAME_WIDTH / 2, HUD_HEIGHT + 34, text, 13, '#a7f070').setAlpha(0);
    this.tweens.add({ targets: label, alpha: 1, y: HUD_HEIGHT + 30, duration: 200 });
    this.tweens.add({ targets: label, alpha: 0, delay: 2200, duration: 400, onComplete: () => label.destroy() });
  }

  banner(text) {
    const label = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, text, 30, '#ffcd75').setScale(0.5);
    this.tweens.add({ targets: label, scale: 1, duration: 250, ease: 'Back.out' });
    this.tweens.add({ targets: label, alpha: 0, delay: 1300, duration: 500, onComplete: () => label.destroy() });
  }

  // Modals ------------------------------------------------------------------

  openModal(build) {
    if (this.modal || this.game_.state.over) return;
    this.joystick.release();
    this.joystick.disabled = true;
    this.scene.pause('Game');
    const container = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1c2c, 0.75).setOrigin(0).setInteractive();
    container.add(shade);
    this.modal = container;
    build(container);
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.destroy();
    this.modal = null;
    this.joystick.disabled = false;
    if (!this.game_.state.over) this.scene.resume('Game');
  }

  pauseIfRunning() {
    if (!this.modal && !this.game_.state.over) this.togglePause();
  }

  togglePause() {
    if (this.modal) {
      if (this.modal.kind === 'pause') this.closeModal();
      return;
    }
    this.openModal((c) => {
      c.kind = 'pause';
      const g = this.add.graphics();
      drawPanel(g, 50, 170, GAME_WIDTH - 100, 280);
      c.add(g);
      c.add(pixelText(this, GAME_WIDTH / 2, 210, 'PAUSED', 28, '#ffcd75'));
      c.add(makeButton(this, GAME_WIDTH / 2, 280, 180, 46, 'RESUME', () => this.closeModal()));
      c.add(makeButton(this, GAME_WIDTH / 2, 342, 180, 46, 'RESTART', () => this.restart(), { color: 0xef7d57 }));
      c.add(makeButton(this, GAME_WIDTH / 2, 404, 180, 46, 'MENU', () => this.toMenu(), { color: 0x3b5dc9 }));
    });
  }

  toggleUpgrades() {
    if (this.modal) {
      if (this.modal.kind === 'upgrades') this.closeModal();
      return;
    }
    this.openModal((c) => {
      c.kind = 'upgrades';
      this.buildUpgradePanel(c);
    });
  }

  toggleBuild() {
    if (this.modal) {
      if (this.modal.kind === 'build') this.closeModal();
      return;
    }
    this.openModal((c) => {
      c.kind = 'build';
      this.buildBuildPanel(c);
    });
  }

  buildBuildPanel(c) {
    const top = 60;
    const rowH = 58;
    const g = this.add.graphics();
    drawPanel(g, 14, top, GAME_WIDTH - 28, 90 + rowH * BUILD_ORDER.length + 60);
    c.add(g);
    c.add(pixelText(this, GAME_WIDTH / 2, top + 24, 'BUILD', 24, '#ffcd75'));
    const have = pixelText(this, GAME_WIDTH / 2, top + 54, '', 12, '#d9d0c1');
    const msg = pixelText(this, GAME_WIDTH / 2, top + 80 + rowH * BUILD_ORDER.length, 'Choose, then tap where to build', 11, '#94b0c2');
    c.add([have, msg]);
    const rows = [];
    const refresh = () => {
      const s = this.game_.state;
      have.setText(`wood ${s.wood}   stone ${s.stone}   beams ${s.beams}`);
      rows.forEach((r) => r.refresh());
    };
    BUILD_ORDER.forEach((id, index) => {
      const def = BUILD_RECIPES[id];
      const y = top + 100 + index * rowH;
      const row = this.add.container(0, y);
      const bg = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH - 44, rowH - 6, 0x1a1c2c, 0.45);
      const icon = this.add.image(44, 0, def.icon).setScale(id === 'beam' || id === 'campfire' ? 1.3 : 0.75);
      const name = pixelText(this, 72, -14, def.name, 13).setOrigin(0, 0.5);
      const desc = pixelText(this, 72, 4, def.desc, 10, '#94b0c2').setOrigin(0, 0.5);
      const cost = pixelText(this, 72, 20, costLabel(def.cost), 10, '#ffcd75').setOrigin(0, 0.5);
      const btn = makeButton(this, GAME_WIDTH - 66, 0, 74, 38, id === 'beam' ? 'MAKE' : 'BUILD', () => {
        if (id !== 'beam') {
          this.startPlacement(id);
          return;
        }
        const error = this.game_.build(id);
        if (error) msg.setText(error).setColor('#b13e53');
        else refresh();
      }, { fontSize: 13, color: 0x8a5a3b });
      row.add([bg, icon, name, desc, cost, btn]);
      row.refresh = () => btn.setEnabled(canPay(this.game_.resources(), def.cost));
      c.add(row);
      rows.push(row);
    });
    c.add(makeButton(this, GAME_WIDTH / 2, top + 110 + rowH * BUILD_ORDER.length + 6, 160, 44, 'CLOSE', () => this.closeModal(), { color: 0x3b5dc9 }));
    refresh();
  }

  // Placement mode: game stays paused, a ghost follows the finger/mouse --------
  startPlacement(id) {
    this.modal.destroy();
    const c = this.add.container(0, 0).setDepth(100);
    c.kind = 'place';
    this.modal = c;
    this.game_.showGhost(id);
    const def = BUILD_RECIPES[id];
    const bar = this.add.graphics();
    drawPanel(bar, 10, GAME_HEIGHT - 128, GAME_WIDTH - 20, 116, 0x1a1c2c);
    const info = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 108, `Aim with tap/mouse - R rotates - Space places`, 12, '#ffcd75');
    const msg = pixelText(this, GAME_WIDTH / 2, GAME_HEIGHT - 88, '', 11, '#b13e53');
    const doPlace = () => {
      const error = this.game_.placeAtGhost(id);
      msg.setText(error);
      if (!error && !canPay(this.game_.resources(), def.cost)) this.endPlacement();
      else if (!error) info.setText(`Placed! Tap to place another`);
    };
    const place = makeButton(this, 66, GAME_HEIGHT - 46, 104, 50, 'PLACE', doPlace, { fontSize: 16 });
    const rotate = makeButton(this, GAME_WIDTH / 2, GAME_HEIGHT - 46, 104, 50, 'ROTATE', () => this.game_.rotateGhost(), { color: 0x8a5a3b, fontSize: 16 });
    // PC: Space places, Esc finishes
    const keys = this.input.keyboard;
    const endKey = () => this.endPlacement();
    keys?.on('keydown-SPACE', doPlace);
    keys?.on('keydown-ESC', endKey);
    const rotateKey = () => this.game_.rotateGhost();
    keys?.on('keydown-R', rotateKey);
    const cancel = makeButton(this, GAME_WIDTH - 66, GAME_HEIGHT - 46, 104, 50, 'DONE', () => this.endPlacement(), { color: 0xb13e53, fontSize: 16 });
    c.add([bar, info, msg, place, rotate, cancel]);
    const move = (pointer, over) => {
      if (over?.some((o) => o.isButton) || pointer.y > GAME_HEIGHT - 132 || pointer.y < 80) return;
      if (pointer.wasTouch && !pointer.isDown) return;
      const p = this.game_.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.game_.moveGhost(p.x, p.y);
    };
    this.input.on('pointerdown', move);
    this.input.on('pointermove', move);
    c.once('destroy', () => {
      keys?.off('keydown-SPACE', doPlace);
      keys?.off('keydown-ESC', endKey);
      keys?.off('keydown-R', rotateKey);
      this.input.off('pointerdown', move);
      this.input.off('pointermove', move);
    });
  }

  endPlacement() {
    this.game_.hideGhost();
    this.closeModal();
  }

  buildUpgradePanel(c) {
    const top = 86;
    const rowH = 66;
    const g = this.add.graphics();
    drawPanel(g, 14, top, GAME_WIDTH - 28, 70 + rowH * UPGRADE_ORDER.length + 60);
    c.add(g);
    c.add(pixelText(this, GAME_WIDTH / 2, top + 24, 'UPGRADES', 24, '#ffcd75'));

    const resources = this.add.container(0, 0);
    c.add(resources);
    const rows = [];

    const refresh = () => {
      resources.removeAll(true);
      const s = this.game_.state;
      resources.add(this.add.image(GAME_WIDTH / 2 - 60, top + 52, 'wood'));
      resources.add(pixelText(this, GAME_WIDTH / 2 - 38, top + 52, String(s.wood), 14).setOrigin(0, 0.5));
      resources.add(this.add.image(GAME_WIDTH / 2 + 20, top + 52, 'stone'));
      resources.add(pixelText(this, GAME_WIDTH / 2 + 38, top + 52, String(s.stone), 14).setOrigin(0, 0.5));
      rows.forEach((r) => r.refresh());
    };

    UPGRADE_ORDER.forEach((id, index) => {
      const def = UPGRADES[id];
      const y = top + 100 + index * rowH;
      const row = this.add.container(0, y);
      const bg = this.add.rectangle(GAME_WIDTH / 2, 0, GAME_WIDTH - 44, rowH - 8, 0x1a1c2c, 0.45);
      const icon = this.add.image(42, 0, def.icon).setScale(1.2);
      const name = pixelText(this, 64, -14, def.name, 13).setOrigin(0, 0.5);
      const desc = pixelText(this, 64, 4, def.desc, 10, '#94b0c2').setOrigin(0, 0.5);
      const cost = pixelText(this, 64, 20, '', 10, '#ffcd75').setOrigin(0, 0.5);
      const btn = makeButton(this, GAME_WIDTH - 66, 0, 74, 38, 'BUY', () => {
        if (this.game_.tryBuy(id)) refresh();
      }, { fontSize: 14 });
      row.add([bg, icon, name, desc, cost, btn]);
      c.add(row);
      row.refresh = () => {
        const level = this.game_.levels[id];
        const price = getCost(id, level);
        name.setText(`${def.name}  Lv${level}/${def.maxLevel}`);
        if (!price) {
          cost.setText('MAXED');
          btn.setLabel('MAX').setEnabled(false);
        } else {
          cost.setText(`${price.wood} wood  ${price.stone} stone`);
          btn.setLabel('BUY').setEnabled(canAfford(this.game_.state, price));
        }
      };
      rows.push(row);
    });

    const closeY = top + 100 + rowH * UPGRADE_ORDER.length + 6;
    c.add(makeButton(this, GAME_WIDTH / 2, closeY, 160, 44, 'CLOSE', () => this.closeModal(), { color: 0x3b5dc9 }));
    refresh();
  }

  restart() {
    this.modal = null;
    this.scene.stop('Game');
    this.scene.start('Game'); // relaunches UI itself
  }

  toMenu() {
    this.modal = null;
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}
