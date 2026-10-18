// Reusable pixel-style UI pieces: buttons, panels, text and a virtual joystick.

import Phaser from 'phaser';
import { COLORS, FONT } from '../config.js';
import { sfx, unlockAudio } from '../audio/sfx.js';

export function pixelText(scene, x, y, text, size = 16, color = '#f4f4f4') {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT,
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color,
      stroke: '#1a1c2c',
      strokeThickness: Math.max(3, Math.round(size / 4)),
      align: 'center',
    })
    .setOrigin(0.5)
    .setResolution(2);
}

export function drawPanel(graphics, x, y, w, h, fill = COLORS.panel, border = COLORS.ink) {
  graphics.fillStyle(border, 1);
  graphics.fillRect(x - 3, y, w + 6, h);
  graphics.fillRect(x, y - 3, w, h + 6);
  graphics.fillStyle(fill, 1);
  graphics.fillRect(x, y, w, h);
  graphics.fillStyle(0xffffff, 0.12);
  graphics.fillRect(x, y, w, 4);
}

// A chunky pixel button. Returns a container with setEnabled(bool) and setLabel(text).
export function makeButton(scene, x, y, w, h, label, onClick, options = {}) {
  const color = options.color ?? COLORS.green;
  const container = scene.add.container(x, y);
  const g = scene.add.graphics();
  const text = pixelText(scene, 0, -2, label, options.fontSize ?? 18);
  container.add([g, text]);
  container.setSize(w, h);

  let enabled = true;
  let pressed = false;

  const redraw = () => {
    g.clear();
    const fill = enabled ? color : COLORS.gray;
    const offset = pressed ? 3 : 0;
    g.fillStyle(COLORS.ink, 1);
    g.fillRect(-w / 2 - 3, -h / 2 + 3, w + 6, h);
    g.fillRect(-w / 2, -h / 2, w, h + 3);
    g.fillStyle(Phaser.Display.Color.ValueToColor(fill).darken(30).color, 1);
    g.fillRect(-w / 2, -h / 2 + offset, w, h);
    g.fillStyle(fill, 1);
    g.fillRect(-w / 2, -h / 2 + offset, w, h - 4);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(-w / 2, -h / 2 + offset, w, 4);
    text.setY(-2 + offset);
    text.setAlpha(enabled ? 1 : 0.6);
  };
  redraw();

  // Container hit areas are measured from its top-left (Phaser adds the display origin).
  container.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h + 3), Phaser.Geom.Rectangle.Contains);
  container.on('pointerdown', (pointer, lx, ly, event) => {
    event?.stopPropagation?.();
    unlockAudio();
    if (!enabled) return;
    pressed = true;
    redraw();
  });
  container.on('pointerout', () => {
    pressed = false;
    redraw();
  });
  container.on('pointerup', (pointer, lx, ly, event) => {
    event?.stopPropagation?.();
    if (!enabled || !pressed) return;
    pressed = false;
    redraw();
    sfx.click();
    onClick();
  });

  container.setEnabled = (value) => {
    enabled = value;
    redraw();
    return container;
  };
  container.setLabel = (value) => {
    text.setText(value);
    return container;
  };
  container.isButton = true;
  return container;
}

// Floating virtual joystick: appears where the thumb lands in the allowed zone.
export class VirtualJoystick {
  constructor(scene, { radius = 46, zoneTop = 0 } = {}) {
    this.scene = scene;
    this.radius = radius;
    this.zoneTop = zoneTop;
    this.vector = new Phaser.Math.Vector2(0, 0);
    this.pointerId = null;
    this.base = scene.add.circle(0, 0, radius, 0x1a1c2c, 0.35).setStrokeStyle(3, 0xf4f4f4, 0.5).setVisible(false).setDepth(50);
    this.thumb = scene.add.circle(0, 0, radius * 0.45, 0xf4f4f4, 0.7).setStrokeStyle(3, 0x1a1c2c, 0.8).setVisible(false).setDepth(51);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
    scene.events.once('shutdown', () => this.destroy());
  }

  onDown(pointer, currentlyOver) {
    if (this.pointerId !== null || this.disabled) return;
    if (pointer.y < this.zoneTop) return;
    if (currentlyOver?.some((obj) => obj.isButton)) return;
    unlockAudio();
    this.pointerId = pointer.id;
    this.origin = new Phaser.Math.Vector2(pointer.x, pointer.y);
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.thumb.setPosition(pointer.x, pointer.y).setVisible(true);
    this.vector.set(0, 0);
  }

  onMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.origin.x;
    const dy = pointer.y - this.origin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.radius);
    const angle = Math.atan2(dy, dx);
    this.thumb.setPosition(this.origin.x + Math.cos(angle) * clamped, this.origin.y + Math.sin(angle) * clamped);
    // small dead zone, analog magnitude
    const magnitude = dist < 6 ? 0 : clamped / this.radius;
    this.vector.set(Math.cos(angle) * magnitude, Math.sin(angle) * magnitude);
  }

  onUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.release();
  }

  release() {
    this.pointerId = null;
    this.vector.set(0, 0);
    this.base.setVisible(false);
    this.thumb.setVisible(false);
  }

  destroy() {
    this.scene.input.off('pointerdown', this.onDown, this);
    this.scene.input.off('pointermove', this.onMove, this);
    this.scene.input.off('pointerup', this.onUp, this);
    this.scene.input.off('pointerupoutside', this.onUp, this);
  }
}
