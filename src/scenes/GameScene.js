import Phaser from 'phaser';
import { PLAYER, RESOURCES, WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';
import { sfx } from '../audio/sfx.js';
import { computeScore, ENEMY_TYPES, getCycle, getDifficulty, pickEnemyType } from '../logic/difficulty.js';
import { buyUpgrade, computeStats, emptyLevels } from '../logic/upgrades.js';
import { submitScore } from '../logic/storage.js';
import { pixelText } from '../ui/widgets.js';

const NODE_DEFS = {
  tree: { texture: 'tree', depleted: 'stump', hp: 4, gives: 'wood', solid: { w: 16, h: 12, ox: 16, oy: 46 } },
  rock: { texture: 'rock', depleted: 'pebbles', hp: 4, gives: 'stone', solid: { w: 30, h: 14, ox: 3, oy: 10 } },
  bush: { texture: 'bush', depleted: 'bushEmpty', hp: 3, gives: 'berry', solid: null },
};

const PARTICLE_COLORS = {
  zombie: 0x38b764,
  runner: 0xb13e53,
  brute: 0x257179,
  wood: 0xffcd75,
  stone: 0x94b0c2,
  berry: 0xb13e53,
  hurt: 0xb13e53,
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.levels = emptyLevels();
    this.stats = computeStats(this.levels);
    this.state = {
      hp: this.stats.maxHp,
      maxHp: this.stats.maxHp,
      wood: 0,
      stone: 0,
      kills: 0,
      killScore: 0,
      elapsed: 0,
      score: 0,
      wave: 1,
      isNight: false,
      over: false,
    };
    this.fireCooldown = 600;
    this.harvestCooldown = 0;
    this.spawnCooldown = 1200;
    this.invulnerableUntil = 0;
    this.nodes = [];

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, 'ground').setOrigin(0).setDepth(-10);
    this.createDecorations();

    this.obstacles = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.shots = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.createNodes();
    this.createPlayer();
    this.createEmitters();
    this.darkness = this.add.image(0, 0, 'darkness').setDepth(9000).setAlpha(0);

    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.enemies, this.enemies);
    this.physics.add.overlap(this.shots, this.enemies, this.onShotHit, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouched, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(300, 26, 28, 44);

    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.input.keyboard?.on('keydown-U', () => this.ui()?.toggleUpgrades());
    this.input.keyboard?.on('keydown-P', () => this.ui()?.togglePause());
    this.input.keyboard?.on('keydown-ESC', () => this.ui()?.togglePause());

    const onHidden = () => this.ui()?.pauseIfRunning();
    this.game.events.on('hidden', onHidden);
    this.events.once('shutdown', () => this.game.events.off('hidden', onHidden));

    this.scene.launch('UI');
    this.scene.bringToTop('UI');
  }

  ui() {
    const ui = this.scene.get('UI');
    return ui && ui.scene.isActive() ? ui : null;
  }

  // World ------------------------------------------------------------------

  createDecorations() {
    const rand = Phaser.Math.Between;
    for (let i = 0; i < 260; i++) {
      const key = Phaser.Utils.Array.GetRandom(['flower', 'flower2', 'tuft', 'tuft', 'tuft']);
      this.add.image(rand(10, WORLD_WIDTH - 10), rand(10, WORLD_HEIGHT - 10), key).setDepth(-5);
    }
  }

  randomFreeSpot(minDistance, avoidCenter = 120) {
    const cx = WORLD_WIDTH / 2;
    const cy = WORLD_HEIGHT / 2;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = Phaser.Math.Between(40, WORLD_WIDTH - 40);
      const y = Phaser.Math.Between(70, WORLD_HEIGHT - 20);
      if (Phaser.Math.Distance.Between(x, y, cx, cy) < avoidCenter) continue;
      const crowded = this.nodes.some((n) => Phaser.Math.Distance.Between(x, y, n.x, n.y) < minDistance);
      if (!crowded) return { x, y };
    }
    return null;
  }

  createNodes() {
    const spawn = (type, count) => {
      for (let i = 0; i < count; i++) {
        const spot = this.randomFreeSpot(56);
        if (spot) this.addNode(type, spot.x, spot.y);
      }
    };
    spawn('tree', RESOURCES.trees);
    spawn('rock', RESOURCES.rocks);
    spawn('bush', RESOURCES.bushes);
  }

  addNode(type, x, y) {
    const def = NODE_DEFS[type];
    let sprite;
    if (def.solid) {
      sprite = this.obstacles.create(x, y, def.texture).setOrigin(0.5, 1);
      sprite.body.setSize(def.solid.w, def.solid.h).setOffset(def.solid.ox, def.solid.oy);
    } else {
      sprite = this.add.image(x, y, def.texture).setOrigin(0.5, 1);
    }
    sprite.setDepth(y);
    const node = { type, def, x, y, sprite, hp: def.hp, depleted: false };
    this.nodes.push(node);
    return node;
  }

  depleteNode(node) {
    node.depleted = true;
    node.sprite.setTexture(node.def.depleted);
    if (node.sprite.body) node.sprite.body.enable = false;
    this.time.delayedCall(RESOURCES.respawnMs, () => {
      if (this.state.over) return;
      node.depleted = false;
      node.hp = node.def.hp;
      node.sprite.setTexture(node.def.texture);
      if (node.sprite.body) {
        node.sprite.body.enable = true;
        node.sprite.refreshBody();
        node.sprite.body.setSize(node.def.solid.w, node.def.solid.h).setOffset(node.def.solid.ox, node.def.solid.oy);
      }
      node.sprite.setAlpha(0);
      this.tweens.add({ targets: node.sprite, alpha: 1, duration: 400 });
    });
  }

  createPlayer() {
    this.shadow = this.add.image(0, 0, 'shadow');
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, 'player0');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 12).setOffset(8, 24);
    this.player.play('player-idle');
  }

  createEmitters() {
    this.emitters = {};
    for (const [name, color] of Object.entries(PARTICLE_COLORS)) {
      this.emitters[name] = this.add
        .particles(0, 0, 'px', {
          speed: { min: 40, max: 140 },
          angle: { min: 0, max: 360 },
          scale: { start: 2, end: 0 },
          lifespan: { min: 250, max: 500 },
          tint: color,
          emitting: false,
        })
        .setDepth(5000);
    }
  }

  burst(name, x, y, count = 8) {
    this.emitters[name]?.explode(count, x, y);
  }

  floatText(x, y, text, color = '#f4f4f4') {
    const label = pixelText(this, x, y, text, 12, color).setDepth(6000);
    this.tweens.add({
      targets: label,
      y: y - 28,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.out',
      onComplete: () => label.destroy(),
    });
  }

  // Loop -------------------------------------------------------------------

  update(time, delta) {
    if (this.state.over) return;
    const dt = Math.min(delta, 50);
    this.state.elapsed += dt;
    const seconds = this.state.elapsed / 1000;
    this.state.score = computeScore(seconds, this.state.killScore);

    const difficulty = getDifficulty(seconds);
    const cycle = getCycle(seconds);
    this.state.wave = cycle.day;
    if (cycle.isNight !== this.state.isNight) {
      this.state.isNight = cycle.isNight;
      sfx.wave();
      this.ui()?.banner(cycle.isNight ? `NIGHT ${cycle.day}\nTHEY ARE COMING` : `DAY ${cycle.day}\nYOU SURVIVED`);
    }
    this.darkness.setPosition(this.player.x, this.player.y).setAlpha(cycle.darkness);

    this.updatePlayer();
    this.updateSpawning(dt, seconds, difficulty);
    this.updateEnemies(time);
    this.updateCombat(dt);
    this.updateHarvest(dt);
    this.updatePickups();
  }

  updatePlayer() {
    let x = 0;
    let y = 0;
    const k = this.keys;
    if (k) {
      if (k.A.isDown || k.LEFT.isDown) x -= 1;
      if (k.D.isDown || k.RIGHT.isDown) x += 1;
      if (k.W.isDown || k.UP.isDown) y -= 1;
      if (k.S.isDown || k.DOWN.isDown) y += 1;
    }
    const stick = this.ui()?.joystick?.vector;
    if (stick && (stick.x !== 0 || stick.y !== 0)) {
      x = stick.x;
      y = stick.y;
    } else if (x !== 0 && y !== 0) {
      x *= Math.SQRT1_2;
      y *= Math.SQRT1_2;
    }
    const speed = this.stats.speed;
    this.player.setVelocity(x * speed, y * speed);
    const moving = Math.abs(x) + Math.abs(y) > 0.05;
    this.player.anims.play(moving ? 'player-walk' : 'player-idle', true);
    if (x < -0.05) this.player.setFlipX(true);
    else if (x > 0.05) this.player.setFlipX(false);
    this.player.setDepth(this.player.y + 18);
    this.shadow.setPosition(this.player.x, this.player.y + 17).setDepth(this.player.y);
  }

  updateSpawning(dt, seconds, difficulty) {
    this.spawnCooldown -= dt;
    if (this.spawnCooldown > 0) return;
    this.spawnCooldown = difficulty.spawnInterval;
    for (let i = 0; i < difficulty.spawnBatch; i++) {
      if (this.enemies.countActive(true) >= difficulty.maxEnemies) return;
      this.spawnEnemy(pickEnemyType(seconds), difficulty);
    }
  }

  spawnEnemy(type, difficulty) {
    const def = ENEMY_TYPES[type];
    let x = 0;
    let y = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(390, 460);
      x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 16, WORLD_WIDTH - 16);
      y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 16, WORLD_HEIGHT - 16);
      if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 330) break;
    }
    const enemy = this.enemies.create(x, y, `${type}0`);
    enemy.play(`${type}-move`);
    enemy.setData({
      type,
      hp: Math.ceil(def.hp * difficulty.hpMultiplier),
      speed: def.speed * difficulty.speedMultiplier,
      damage: def.damage,
      score: def.score,
      knockUntil: 0,
      phase: Math.random() * Math.PI * 2,
    });
    if (type === 'brute') enemy.setScale(1.5);
    enemy.body.setSize(24, 20).setOffset(6, 14);
    enemy.setAlpha(0);
    this.tweens.add({ targets: enemy, alpha: 1, duration: 300 });
  }

  updateEnemies(time) {
    const px = this.player.x;
    const py = this.player.y;
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;
      enemy.setDepth(enemy.y + 18);
      if (time < enemy.getData('knockUntil')) continue;
      const angle = Math.atan2(py - enemy.y, px - enemy.x);
      const speed = enemy.getData('speed');
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      if (enemy.getData('type') === 'bat') {
        const wobble = Math.sin(time / 180 + enemy.getData('phase')) * 60;
        vx += Math.cos(angle + Math.PI / 2) * wobble;
        vy += Math.sin(angle + Math.PI / 2) * wobble;
      }
      enemy.setVelocity(vx, vy);
      enemy.setFlipX(vx < 0);
    }
  }

  nearestEnemy(range) {
    let best = null;
    let bestDist = range;
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (d < bestDist) {
        best = enemy;
        bestDist = d;
      }
    }
    return best;
  }

  updateCombat(dt) {
    this.fireCooldown -= dt;
    if (this.fireCooldown > 0) return;
    const target = this.nearestEnemy(this.stats.range);
    if (!target) return;
    this.fireCooldown = this.stats.fireInterval;
    const base = Math.atan2(target.y - this.player.y, target.x - this.player.x);
    const count = this.stats.projectiles;
    const spread = Phaser.Math.DegToRad(14);
    for (let i = 0; i < count; i++) {
      const angle = base + (i - (count - 1) / 2) * spread;
      const shot = this.shots.create(this.player.x, this.player.y - 4, 'shot');
      shot.setDepth(5500);
      shot.body.setCircle(5, 1, 1);
      shot.setVelocity(Math.cos(angle) * 330, Math.sin(angle) * 330);
      shot.setData('damage', this.stats.damage);
      this.time.delayedCall(700, () => shot.destroy());
    }
    sfx.shoot();
  }

  onShotHit(shot, enemy) {
    if (!shot.active || !enemy.active) return;
    const damage = shot.getData('damage');
    shot.destroy();
    const hp = enemy.getData('hp') - damage;
    enemy.setData('hp', hp);
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(70, () => enemy.active && enemy.clearTint());
    const angle = Math.atan2(enemy.y - this.player.y, enemy.x - this.player.x);
    const knock = enemy.getData('type') === 'brute' ? 60 : 170;
    enemy.setVelocity(Math.cos(angle) * knock, Math.sin(angle) * knock);
    enemy.setData('knockUntil', this.time.now + 110);
    if (hp <= 0) this.killEnemy(enemy);
    else sfx.hit();
  }

  killEnemy(enemy) {
    const type = enemy.getData('type');
    this.burst(type, enemy.x, enemy.y, type === 'brute' ? 20 : 10);
    sfx.enemyDie();
    this.state.kills += 1;
    this.state.killScore += enemy.getData('score');
    this.floatText(enemy.x, enemy.y - 16, `+${enemy.getData('score')}`, '#ffcd75');
    const roll = Math.random();
    const dropChance = type === 'brute' ? 1 : 0.3;
    if (roll < dropChance) {
      const kind = Phaser.Utils.Array.GetRandom(['berry', 'wood', 'stone', 'wood', 'stone']);
      this.spawnPickup(kind, enemy.x, enemy.y);
    }
    enemy.destroy();
  }

  spawnPickup(kind, x, y) {
    const pickup = this.pickups.create(x, y, kind);
    pickup.setData('kind', kind).setDepth(y);
    pickup.body.setSize(pickup.width + 8, pickup.height + 8);
    this.tweens.add({ targets: pickup, y: y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.time.delayedCall(15000, () => pickup.active && pickup.destroy());
  }

  updatePickups() {
    for (const pickup of this.pickups.getChildren()) {
      if (!pickup.active) continue;
      const d = Phaser.Math.Distance.Between(pickup.x, pickup.y, this.player.x, this.player.y);
      if (d < PLAYER.pickupRange) {
        this.tweens.killTweensOf(pickup);
        this.physics.moveToObject(pickup, this.player, 260);
      }
    }
  }

  onPickup(player, pickup) {
    if (!pickup.active) return;
    const kind = pickup.getData('kind');
    pickup.destroy();
    this.gain(kind, 1, pickup.x, pickup.y);
  }

  gain(kind, amount, x, y) {
    if (kind === 'berry') {
      const heal = 12 * amount;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + heal);
      this.floatText(x, y - 20, `+${heal} HP`, '#a7f070');
      sfx.heal();
    } else {
      this.state[kind] += amount;
      this.floatText(x, y - 20, `+${amount} ${kind}`, kind === 'wood' ? '#ffcd75' : '#94b0c2');
      sfx.pickup();
    }
  }

  updateHarvest(dt) {
    this.harvestCooldown -= dt;
    if (this.harvestCooldown > 0) return;
    const px = this.player.x;
    const py = this.player.y + 16; // feet
    let best = null;
    let bestDist = PLAYER.harvestRange;
    for (const node of this.nodes) {
      if (node.depleted) continue;
      if (node.type === 'bush' && this.state.hp >= this.state.maxHp) continue;
      const d = Phaser.Math.Distance.Between(px, py, node.x, node.y - 6);
      if (d < bestDist) {
        best = node;
        bestDist = d;
      }
    }
    if (!best) return;
    this.harvestCooldown = this.stats.harvestInterval;
    best.hp -= 1;
    sfx.chop();
    this.burst(best.def.gives, best.x, best.y - 14, 6);
    this.tweens.add({ targets: best.sprite, x: best.x + 2, duration: 40, yoyo: true, repeat: 1, onComplete: () => best.sprite.setX(best.x) });
    this.gain(best.def.gives, 1, best.x, best.y - 20);
    if (best.hp <= 0) this.depleteNode(best);
  }

  onPlayerTouched(player, enemy) {
    if (this.state.over || this.time.now < this.invulnerableUntil) return;
    this.invulnerableUntil = this.time.now + PLAYER.invulnerableMs;
    this.state.hp = Math.max(0, this.state.hp - enemy.getData('damage'));
    sfx.hurt();
    this.burst('hurt', player.x, player.y, 8);
    this.cameras.main.shake(120, 0.008);
    this.tweens.add({ targets: player, alpha: 0.3, duration: 80, yoyo: true, repeat: 3, onComplete: () => player.setAlpha(1) });
    const angle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
    enemy.setVelocity(Math.cos(angle) * 220, Math.sin(angle) * 220);
    enemy.setData('knockUntil', this.time.now + 200);
    if (this.state.hp <= 0) this.gameOver();
  }

  // Upgrades (called from UI) ---------------------------------------------------

  tryBuy(id) {
    const result = buyUpgrade(id, this.levels, { wood: this.state.wood, stone: this.state.stone });
    if (!result.ok) return false;
    const oldMax = this.stats.maxHp;
    this.levels = result.levels;
    this.state.wood = result.resources.wood;
    this.state.stone = result.resources.stone;
    this.stats = computeStats(this.levels);
    if (this.stats.maxHp > oldMax) {
      this.state.maxHp = this.stats.maxHp;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + 20);
    }
    sfx.upgrade();
    return true;
  }

  // End ---------------------------------------------------------------------

  gameOver() {
    this.state.over = true;
    this.physics.pause();
    this.player.anims.stop();
    this.player.setTint(0xb13e53);
    this.ui()?.joystick?.release();
    sfx.gameOver();
    const result = {
      score: this.state.score,
      kills: this.state.kills,
      seconds: Math.floor(this.state.elapsed / 1000),
      isNewBest: submitScore(this.state.score),
    };
    this.time.delayedCall(900, () => {
      this.scene.stop('UI');
      this.scene.launch('GameOver', result);
    });
  }
}
