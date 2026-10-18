import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, PLAYER, RESOURCES, WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';
import { sfx } from '../audio/sfx.js';
import { computeScore, CYCLE_SECONDS, DAY_SECONDS, ENEMY_TYPES, getCycle, getDifficulty, isBloodMoon, pickEnemyType } from '../logic/difficulty.js';
import { buyUpgrade, computeStats, emptyLevels } from '../logic/upgrades.js';
import { submitScore } from '../logic/storage.js';
import { addXp, cardModifiers, CARDS, XP_PER_KILL } from '../logic/cards.js';
import { crateTier, LOOT, lootLabel, rollLoot } from '../logic/loot.js';
import { addSouls, computeSouls, loadMeta, metaModifiers, saveMeta } from '../logic/meta.js';
import { BUILD_RECIPES, pay } from '../logic/building.js';
import { eat, HUNGER, tickHunger } from '../logic/survival.js';
import { applyDamage, centeredRect, chooseTarget, isFree, separation, shouldChase, snap, validatePlacement } from '../logic/placement.js';
import { pixelText } from '../ui/widgets.js';

const CAMP_HP = 400;
const STARTER_FENCE_HP = 150;

const NODE_DEFS = {
  tree: { texture: 'tree', depleted: 'stump', hp: 4, gives: 'wood', solid: { w: 16, h: 12, ox: 16, oy: 46 } },
  rock: { texture: 'rock', depleted: 'pebbles', hp: 4, gives: 'stone', solid: { w: 30, h: 14, ox: 3, oy: 10 } },
  bush: { texture: 'bush', depleted: 'bushEmpty', hp: 3, gives: 'berry', solid: null },
};

const PARTICLE_COLORS = {
  zombie: 0x7a1420,
  runner: 0x9a1628,
  brute: 0x5a0c14,
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
    this.meta = metaModifiers(loadMeta().levels);
    this.cards = {};
    this.cardMods = cardModifiers(this.cards);
    this.levels = emptyLevels();
    this.stats = this.withMeta(computeStats(this.levels));
    this.state = {
      hp: this.stats.maxHp,
      maxHp: this.stats.maxHp,
      wood: this.meta.startWood,
      stone: this.meta.startStone,
      nightsSurvived: 0,
      bloodMoonsSurvived: 0,
      bonusSouls: 0,
      level: 1,
      xp: 0,
      pendingLevelUps: 0,
      lootOpened: 0,
      beams: 0,
      hunger: HUNGER.max,
      bloodMoon: false,
      warned: false,
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
    this.walls = this.physics.add.staticGroup();
    this.spikes = this.physics.add.staticGroup();
    this.doors = this.physics.add.staticGroup();
    this.fires = this.physics.add.staticGroup();
    this.groupsByKind = { wall: this.walls, door: this.doors, trap: this.spikes, fire: this.fires };
    this.facing = new Phaser.Math.Vector2(0, 1);
    this.buildAngle = 0; // 0 = horizontal, 90 = vertical
    this.hordeAngle = Math.random() * Math.PI * 2;
    this.nextGroan = 0;
    this.enemies = this.physics.add.group();
    this.shots = this.physics.add.group();
    this.pickups = this.physics.add.group();
    this.createNodes();
    this.createLoot();
    this.createCamp();
    this.createPlayer();
    this.createEmitters();
    // Night overlay redrawn every frame with light holes (player + campfires)
    this.night = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT).setOrigin(0).setScrollFactor(0).setDepth(9000);
    this.lightStamp = this.make.image({ key: 'light', add: false });
    this.createWeather();

    // No physical zombie-vs-zombie collider: crowd pushing shoved zombies through thin walls.
    // Crowds spread out with velocity-based separation instead (see updateEnemies), so walls always win.
    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.enemies, this.obstacles);
    this.physics.add.collider(this.enemies, this.walls, this.onZombieHitsWall, null, this);
    this.physics.add.collider(this.enemies, this.doors, this.onZombieHitsWall, null, this);
    this.physics.add.overlap(this.enemies, this.spikes, this.onZombieOnSpikes, null, this);
    this.physics.add.overlap(this.shots, this.enemies, this.onShotHit, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerTouched, null, this);
    this.physics.add.overlap(this.player, this.pickups, this.onPickup, null, this);

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.fadeIn(300, 26, 28, 44);

    this.keys = this.input.keyboard?.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');

    this.input.keyboard?.on('keydown-B', () => this.ui()?.toggleBuild());
    if (import.meta.env.DEV) {
      // Test shortcut (dev server only): N = jump to the next day/night phase
      this.input.keyboard?.on('keydown-N', () => {
        const s = this.state.elapsed / 1000;
        const phase = s % CYCLE_SECONDS;
        const next = phase < DAY_SECONDS ? s - phase + DAY_SECONDS + 0.1 : s - phase + CYCLE_SECONDS + 0.1;
        this.state.elapsed = next * 1000;
      });
    }
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
      const key = Phaser.Utils.Array.GetRandom(['tuft', 'tuft', 'tuft', 'tuft', 'bones', 'skull', 'blood']);
      const deco = this.add.image(rand(10, WORLD_WIDTH - 10), rand(10, WORLD_HEIGHT - 10), key).setDepth(-5);
      if (key === 'blood') deco.setAlpha(0.35).setFlipX(Math.random() < 0.5);
    }
    // Old graves scattered in the forest
    for (let i = 0; i < 26; i++) {
      const x = rand(30, WORLD_WIDTH - 30);
      const y = rand(40, WORLD_HEIGHT - 10);
      this.add.image(x, y, 'grave').setOrigin(0.5, 1).setDepth(y).setTint(0xb8b0a8);
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
    // Withered, desaturated vegetation
    if (type !== 'rock') sprite.setTint(type === 'tree' ? 0x8c8a6e : 0x9a8f78);
    const node = { type, def, x, y, sprite, hp: def.hp, depleted: false };
    this.nodes.push(node);
    return node;
  }

  depleteNode(node) {
    node.depleted = true;
    node.sprite.setTexture(node.def.depleted);
    if (node.sprite.body) node.sprite.body.enable = false;
    const regrow = () => {
      if (this.state.over || !node.sprite.active) return;
      // Never regrow a solid tree/rock on top of a wall, zombie or the player
      if (node.def.solid) {
        const s = node.def.solid;
        const area = { x: node.x - node.sprite.width / 2 + s.ox, y: node.y - node.sprite.height + s.oy, w: s.w, h: s.h };
        if (!isFree(area, this.placementBlockers())) {
          this.time.delayedCall(3000, regrow);
          return;
        }
      }
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
    };
    this.time.delayedCall(RESOURCES.respawnMs, regrow);
  }

  createPlayer() {
    this.shadow = this.add.image(0, 0, 'shadow');
    this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2 + 50, 'player0');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 12).setOffset(8, 24);
    this.player.play('player-idle');
  }

  createEmitters() {
    this.emitters = {};
    this.emitters.trail = this.add.particles(0, 0, 'px', { speed: 5, scale: { start: 1.2, end: 0 }, alpha: { start: 0.6, end: 0 }, lifespan: 220, tint: 0x94b0c2, emitting: false }).setDepth(5400);
    this.emitters.spark = this.add.particles(0, 0, 'px', { speed: { min: 60, max: 160 }, scale: { start: 1.5, end: 0 }, lifespan: 180, tint: [0xffcd75, 0xf4f4f4], emitting: false }).setDepth(5600);
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
    this.state.phaseProgress = cycle.progress;
    this.state.untilNight = cycle.untilNight;
    // Dusk warning: 10 seconds to get behind your walls
    if (!cycle.isNight && cycle.untilNight <= 10 && !this.state.warned) {
      this.state.warned = true;
      sfx.warning();
      this.ui()?.banner(isBloodMoon(cycle.day) ? 'BLOOD MOON RISING\nGET INSIDE' : 'NIGHT IS COMING\nGET INSIDE');
    }
    if (cycle.isNight !== this.state.isNight) {
      this.state.isNight = cycle.isNight;
      this.state.bloodMoon = cycle.bloodMoon;
      this.state.warned = false;
      sfx.wave();
      if (cycle.isNight) {
        this.hordeAngle = Math.random() * Math.PI * 2;
        this.nightWasBloodMoon = cycle.bloodMoon;
        this.cameras.main.shake(300, 0.004);
        this.ui()?.banner(cycle.bloodMoon ? `BLOOD MOON
NIGHT ${cycle.day}` : `NIGHT ${cycle.day}\nTHE DEAD RISE`);
      } else {
        this.ui()?.banner(`DAY ${cycle.day}\nYOU MADE IT... FOR NOW`);
        this.burnZombies();
        if (this.state.elapsed > 1000) {
          this.state.nightsSurvived += 1;
          if (this.nightWasBloodMoon) this.state.bloodMoonsSurvived += 1;
        }
      }
    }
    this.drawNight(0.32 + 0.68 * cycle.darkness); // gloomy even by day
    this.updateSurvival(dt / 1000);
    this.updateWeather(dt);

    this.updatePlayer();
    this.updateSpawning(dt, seconds, difficulty);
    this.updateEnemies(time);
    this.updateCombat(dt);
    this.updateHarvest(dt);
    this.updatePickups();
    this.updateLoot(dt);
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
    if (moving) this.facing.set(x, y).normalize();
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
    // The horde shifts its approach every now and then
    if (Math.random() < 0.15) this.hordeAngle += Phaser.Math.FloatBetween(-1.2, 1.2);
    for (let i = 0; i < difficulty.spawnBatch; i++) {
      if (this.enemies.countActive(true) >= difficulty.maxEnemies) return;
      this.spawnEnemy(pickEnemyType(seconds), difficulty);
    }
  }

  spawnEnemy(type, difficulty, at = null) {
    const def = ENEMY_TYPES[type];
    const blockers = [...this.allStructures(), ...this.obstacles.getChildren()]
      .filter((s) => s.body?.enable)
      .map((s) => ({ x: s.body.x, y: s.body.y, w: s.body.width, h: s.body.height }));
    let x = 0;
    let y = 0;
    let found = false;
    if (at) {
      x = Phaser.Math.Clamp(at.x, 16, WORLD_WIDTH - 16);
      y = Phaser.Math.Clamp(at.y, 16, WORLD_HEIGHT - 16);
      found = isFree(centeredRect(x, y + 6, 28, 24), blockers);
    }
    for (let attempt = 0; attempt < 12 && !found && !at; attempt++) {
      if (difficulty.isNight) {
        // Night: the horde arrives in a pack from one direction, just off screen
        const angle = this.hordeAngle + Phaser.Math.FloatBetween(-0.6, 0.6);
        const distance = Phaser.Math.Between(390, 470);
        const center = this.camp?.active ? this.camp : this.player;
        x = Phaser.Math.Clamp(center.x + Math.cos(angle) * distance, 16, WORLD_WIDTH - 16);
        y = Phaser.Math.Clamp(center.y + Math.sin(angle) * distance, 16, WORLD_HEIGHT - 16);
      } else {
        // Day: stragglers anywhere in the forest, out of sight
        x = Phaser.Math.Between(16, WORLD_WIDTH - 16);
        y = Phaser.Math.Between(16, WORLD_HEIGHT - 16);
      }
      found = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) > 360 && isFree(centeredRect(x, y + 6, 28, 24), blockers);
    }
    if (!found) return; // never spawn inside a wall or tree
    const elite = this.state.bloodMoon;
    const enemy = this.enemies.create(x, y, `${type}0`);
    enemy.play(`${type}-move`);
    enemy.setData({
      type,
      hp: Math.ceil(def.hp * difficulty.hpMultiplier * (elite ? 1.5 : 1)),
      speed: def.speed * difficulty.speedMultiplier * (elite ? 1.15 : 1),
      damage: def.damage,
      score: def.score * (elite ? 2 : 1),
      knockUntil: 0,
      aggro: difficulty.isNight, // day zombies wander until they see the player
      wanderUntil: 0,
      shadow: this.add.image(x, y + 17, 'shadow').setAlpha(0.8),
    });
    if (elite) enemy.setTint(0xff9a9a);
    if (type === 'brute') enemy.setScale(1.5);
    enemy.body.setSize(24, 20).setOffset(6, 14);
    enemy.setAlpha(0);
    this.tweens.add({ targets: enemy, alpha: 1, duration: 300 });
  }

  updateEnemies(time) {
    const px = this.player.x;
    const py = this.player.y;
    const view = this.cameras.main.worldView;
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active) continue;
      enemy.setDepth(enemy.y + 18);
      enemy.getData('shadow')?.setPosition(enemy.x, enemy.y + (enemy.getData('type') === 'brute' ? 26 : 17)).setDepth(enemy.y);
      if (time < enemy.getData('knockUntil')) continue;
      const speed = enemy.getData('speed');
      const chase = shouldChase({
        isNight: this.state.isNight,
        onScreen: Phaser.Geom.Rectangle.Contains(view, enemy.x, enemy.y),
        aggro: enemy.getData('aggro'),
      });
      if (!chase) {
        if (time > enemy.getData('wanderUntil')) {
          const a = Math.random() * Math.PI * 2;
          const v = Math.random() < 0.3 ? 0 : speed * 0.35;
          enemy.setVelocity(Math.cos(a) * v, Math.sin(a) * v);
          enemy.setData('wanderUntil', time + Phaser.Math.Between(1500, 3500));
        }
        enemy.setFlipX(enemy.body.velocity.x < 0);
        continue;
      }
      if (!enemy.getData('aggro')) {
        enemy.setData('aggro', true);
        this.floatText(enemy.x, enemy.y - 22, '!', '#b13e53');
      }
      const goal = chooseTarget({
        isNight: this.state.isNight,
        campAlive: Boolean(this.camp?.active),
        distanceToPlayer: Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y),
      }) === 'camp' ? this.camp : this.player;
      const angle = Math.atan2(goal.y - enemy.y, goal.x - enemy.x);
      const push = separation(enemy, this.enemies.getChildren(), 22);
      const vx = Math.cos(angle) * speed + push.x * speed * 0.9;
      const vy = Math.sin(angle) * speed + push.y * speed * 0.9;
      enemy.setVelocity(vx, vy);
      enemy.setFlipX(vx < 0);
      // Occasional groans from nearby hunters
      if (time > this.nextGroan && Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) < 200) {
        this.nextGroan = time + Phaser.Math.Between(1800, 4000);
        sfx.groan();
      }
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
    // Dust trail behind flying stones
    for (const shot of this.shots.getChildren()) {
      if (shot.active) this.emitters.trail.emitParticleAt(shot.x, shot.y, 1);
    }
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
      shot.setVelocity(Math.cos(angle) * 340, Math.sin(angle) * 340);
      shot.setData({ damage: this.stats.damage, pierce: this.cardMods.pierce, hits: new Set() });
      this.time.delayedCall(700, () => shot.destroy());
    }
    // Small throw recoil
    this.tweens.add({ targets: this.player, scaleX: 1.12, scaleY: 0.9, duration: 50, yoyo: true });
    sfx.shoot();
  }

  onShotHit(shot, enemy) {
    if (!shot.active || !enemy.active) return;
    const hits = shot.getData('hits');
    if (hits?.has(enemy)) return; // a piercing stone hits each zombie once
    hits?.add(enemy);
    let damage = shot.getData('damage');
    if (Math.random() < this.cardMods.critChance) {
      damage *= 3;
      this.floatText(enemy.x, enemy.y - 32, 'CRIT!', '#ffcd75');
    }
    const pierce = shot.getData('pierce') ?? 0;
    if (pierce > 0) shot.setData('pierce', pierce - 1);
    else shot.destroy();
    this.emitters.spark.explode(5, shot.x, shot.y);
    this.hurtEnemy(enemy, damage, this.player.x, this.player.y);
  }

  // Shared damage path for shots, spikes, etc.
  hurtEnemy(enemy, damage, fromX, fromY) {
    if (!enemy.active) return;
    const hp = enemy.getData('hp') - damage;
    enemy.setData('hp', hp);
    enemy.setData('aggro', true);
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(70, () => {
      if (!enemy.active) return;
      enemy.clearTint();
      if (this.state.bloodMoon) enemy.setTint(0xff9a9a);
    });
    this.burst('hurt', enemy.x, enemy.y, 3);
    this.floatText(enemy.x + Phaser.Math.Between(-6, 6), enemy.y - 18, `-${damage}`, '#ff6b6b');
    const angle = Math.atan2(enemy.y - fromY, enemy.x - fromX);
    const knock = enemy.getData('type') === 'brute' ? 60 : 170;
    enemy.setVelocity(Math.cos(angle) * knock, Math.sin(angle) * knock);
    enemy.setData('knockUntil', this.time.now + 110);
    if (hp <= 0) this.killEnemy(enemy);
    else sfx.hit();
  }

  killEnemy(enemy) {
    if (!enemy.active) return;
    const type = enemy.getData('type');
    enemy.getData('shadow')?.destroy();
    this.cameras.main.shake(70, type === 'brute' ? 0.008 : 0.003);
    this.burst(type, enemy.x, enemy.y, type === 'brute' ? 20 : 10);
    // Blood stays on the ground, slowly fading
    const splat = this.add.image(enemy.x, enemy.y + 10, 'blood').setDepth(-4).setFlipX(Math.random() < 0.5).setScale(type === 'brute' ? 1.6 : 1);
    this.tweens.add({ targets: splat, alpha: 0, delay: 25000, duration: 5000, onComplete: () => splat.destroy() });
    sfx.enemyDie();
    this.state.kills += 1;
    this.state.killScore += enemy.getData('score');
    this.onKillCards(enemy, type);
    this.floatText(enemy.x, enemy.y - 16, `+${enemy.getData('score')}`, '#ffcd75');
    const roll = Math.random();
    const dropChance = type === 'brute' ? 1 : 0.3;
    if (roll < dropChance) {
      const kind = Phaser.Utils.Array.GetRandom(['berry', 'wood', 'stone', 'wood', 'stone']);
      this.spawnPickup(kind, enemy.x, enemy.y);
    }
    enemy.destroy();
  }

  // Dawn: every zombie crumbles in the sunlight (no score).
  burnZombies() {
    for (const enemy of [...this.enemies.getChildren()]) {
      if (!enemy.active) continue;
      enemy.body.enable = false;
      enemy.setTint(0xef7d57);
      this.burst('wood', enemy.x, enemy.y, 6);
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        y: enemy.y - 10,
        duration: 700,
        delay: Math.random() * 600,
        onComplete: () => {
          enemy.getData('shadow')?.destroy();
          enemy.destroy();
        },
      });
    }
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
      if (d < PLAYER.pickupRange + this.cardMods.pickupBonus) {
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
      this.state.hunger = eat(this.state.hunger, HUNGER.berryFood * amount);
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + HUNGER.berryHeal * amount);
      this.floatText(x, y - 20, `+${HUNGER.berryFood * amount} food`, '#a7f070');
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
      if (node.type === 'bush' && this.state.hunger >= HUNGER.max - 5 && this.state.hp >= this.state.maxHp) continue;
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
    this.gain(best.def.gives, 1 + (best.def.gives === 'berry' ? 0 : this.cardMods.gatherBonus), best.x, best.y - 20);
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

  // Building (called from UI) ---------------------------------------------------

  resources() {
    return { wood: this.state.wood, stone: this.state.stone, beams: this.state.beams };
  }

  // Returns a short message for the UI ('' on success).
  build(id) {
    const recipe = BUILD_RECIPES[id];
    const after = pay(this.resources(), recipe.cost);
    if (!after) return 'Not enough materials';
    if (id === 'beam') {
      Object.assign(this.state, after);
      this.state.beams += 1;
      sfx.chop();
      return '';
    }
    const spot = this.defaultSpot();
    return this.placeAt(id, spot.x, spot.y);
  }

  // Ash always drifting, rain at night, fog rolling over the screen (screen-space layers)
  createWeather() {
    this.fog = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'fog').setOrigin(0).setScrollFactor(0).setDepth(8900).setAlpha(0.12);
    this.add.particles(0, 0, 'px', {
      x: { min: 0, max: GAME_WIDTH }, y: -6, lifespan: 7000, speedY: { min: 18, max: 40 }, speedX: { min: -18, max: 6 },
      scale: { min: 0.6, max: 1.2 }, alpha: { start: 0.5, end: 0 }, tint: [0x94b0c2, 0x566c86], frequency: 140,
    }).setScrollFactor(0).setDepth(9100);
    this.rain = this.add.particles(0, 0, 'rain', {
      x: { min: -40, max: GAME_WIDTH + 40 }, y: -10, lifespan: 1300, speedY: { min: 480, max: 560 }, speedX: -70,
      rotate: 8, alpha: { start: 0.35, end: 0.15 }, quantity: 2, frequency: 16, emitting: false,
    }).setScrollFactor(0).setDepth(9100);
  }

  updateWeather(dt) {
    this.fog.tilePositionX += dt * 0.012;
    this.fog.tilePositionY += dt * 0.004;
    this.fog.tilePositionX += (this.cameras.main.scrollX - (this.lastScrollX ?? 0)) * 0.6;
    this.lastScrollX = this.cameras.main.scrollX;
    this.fog.setAlpha(this.state.isNight ? 0.22 : 0.12);
    this.rain.emitting = this.state.isNight;
  }

  allStructures() {
    return [this.walls, this.doors, this.spikes, this.fires].flatMap((g) => g.getChildren());
  }

  drawNight(alpha) {
    const cam = this.cameras.main;
    this.night.clear().fill(this.state.bloodMoon ? 0x2a0306 : 0x0e060a, alpha * 0.92);
    const stamp = (x, y, scale) => {
      this.lightStamp.setScale(scale).setPosition(x - cam.scrollX, y - cam.scrollY);
      this.night.erase(this.lightStamp);
    };
    stamp(this.player.x, this.player.y, 1);
    if (this.camp?.active) stamp(this.camp.x, this.camp.y, 1.7 + Math.random() * 0.05);
    for (const fire of this.fires.getChildren()) stamp(fire.x, fire.y, 1.5 + Math.random() * 0.05);
  }

  // Hunger + campfire healing
  updateSurvival(dt) {
    const { hunger, damage } = tickHunger(this.state.hunger, dt * this.meta.hungerMultiplier);
    this.state.hunger = hunger;
    let hp = this.state.hp - damage;
    const nearFire = [...this.fires.getChildren(), ...(this.camp?.active ? [this.camp] : [])].some((f) => Phaser.Math.Distance.Between(f.x, f.y, this.player.x, this.player.y) < 90);
    if (nearFire) hp += 2 * dt;
    hp += this.cardMods.regen * dt;
    if (!this.state.isNight && this.cardMods.repairPerSecond) this.repairStructures(this.cardMods.repairPerSecond * dt);
    this.state.hp = Phaser.Math.Clamp(hp, 0, this.state.maxHp);
    this.state.nearFire = nearFire;
    if (this.state.hp <= 0 && !this.state.over) this.gameOver();
  }

  // Placement ------------------------------------------------------------------

  snapSpot(x, y) {
    return { x: snap(x), y: snap(y) };
  }

  // One step in front of the player
  defaultSpot() {
    return this.snapSpot(this.player.x + this.facing.x * 36, this.player.y + 12 + this.facing.y * 36);
  }

  // Texture used for a structure in the current orientation
  structureKey(id) {
    return this.buildAngle === 90 && this.textures.exists(`${id}_v`) ? `${id}_v` : id;
  }

  // Everything a new structure may not overlap: structures, solid obstacles, zombies, the player
  placementBlockers() {
    const rect = (b) => ({ x: b.x, y: b.y, w: b.width, h: b.height });
    const blockers = this.allStructures().map((s) => rect(s.body));
    for (const n of this.nodes) if (!n.depleted && n.sprite.body?.enable) blockers.push(rect(n.sprite.body));
    for (const e of this.enemies.getChildren()) if (e.active && e.body?.enable) blockers.push(rect(e.body));
    blockers.push(rect(this.player.body));
    return blockers;
  }

  footprintFor(id, x, y) {
    const src = this.textures.get(this.structureKey(id)).getSourceImage();
    return centeredRect(x, y, src.width, src.height);
  }

  placementError(x, y, id = this.ghostId ?? 'wall') {
    return validatePlacement({
      area: this.footprintFor(id, x, y),
      worldWidth: WORLD_WIDTH,
      worldHeight: WORLD_HEIGHT,
      playerX: this.player.x,
      playerY: this.player.y + 12,
      blockers: this.placementBlockers(),
    });
  }

  rotateGhost() {
    this.buildAngle = this.buildAngle === 90 ? 0 : 90;
    if (this.ghost) {
      this.ghost.setTexture(this.structureKey(this.ghostId));
      this.moveGhost(this.ghost.x, this.ghost.y);
    }
  }

  showGhost(id) {
    const spot = this.defaultSpot();
    this.ghost?.destroy();
    this.ghostId = id;
    this.ghost = this.add.image(spot.x, spot.y, this.structureKey(id)).setDepth(9500);
    this.moveGhost(spot.x, spot.y);
  }

  moveGhost(worldX, worldY) {
    if (!this.ghost) return;
    const spot = this.snapSpot(worldX, worldY);
    const ok = !this.placementError(spot.x, spot.y);
    this.ghost.setPosition(spot.x, spot.y).setAlpha(0.7).setTint(ok ? 0x88ff88 : 0xff5555);
  }

  hideGhost() {
    this.ghost?.destroy();
    this.ghost = null;
    this.ghostId = null;
  }

  placeAtGhost(id) {
    if (!this.ghost) return 'Nothing to place';
    const error = this.placeAt(id, this.ghost.x, this.ghost.y);
    this.moveGhost(this.ghost.x, this.ghost.y);
    return error;
  }

  placeAt(id, x, y) {
    const recipe = BUILD_RECIPES[id];
    const after = pay(this.resources(), recipe.cost);
    if (!after) return 'Not enough materials';
    const error = this.placementError(x, y, id);
    if (error) return error;

    Object.assign(this.state, after);
    const group = this.groupsByKind[recipe.kind];
    // Static body is created from the (already rotated) texture, so it matches the art exactly
    const piece = group.create(x, y, this.structureKey(id));
    const maxHp = Math.round(recipe.hp * this.meta.structureHpMultiplier * this.cardMods.structureHpMultiplier);
    piece.setData({ id, hp: maxHp, maxHp, nextHit: 0 });
    piece.setDepth(recipe.kind === 'trap' ? y - 20 : y + piece.height / 2);
    if (recipe.kind === 'fire') {
      this.tweens.add({ targets: piece, scaleY: 1.12, duration: 160, yoyo: true, repeat: -1 });
    } else {
      // Pop-in (visual only; the static body keeps the real size)
      piece.setScale(1.2);
      this.tweens.add({ targets: piece, scale: 1, duration: 160, ease: 'Back.out' });
    }
    this.burst('wood', x, y, 10);
    this.cameras.main.shake(60, 0.003);
    sfx.build();
    return '';
  }

  damageStructure(piece, amount) {
    if (!piece.active) return;
    const { hp, destroyed } = applyDamage(piece.getData('hp'), amount);
    piece.setData('hp', hp);
    piece.setTintFill(0xffffff);
    this.time.delayedCall(60, () => piece.active && piece.clearTint());
    this.burst(piece.getData('id') === 'stoneWall' ? 'stone' : 'wood', piece.x, piece.y, 4);
    // Health bar above damaged structures
    const bar = piece.getData('bar') ?? this.add.graphics().setDepth(8000);
    piece.setData('bar', bar);
    const ratio = hp / piece.getData('maxHp');
    const w = Math.max(24, Math.min(piece.width, 40));
    bar.clear();
    bar.fillStyle(0x1a1c2c, 0.9).fillRect(piece.x - w / 2 - 1, piece.y - piece.height / 2 - 9, w + 2, 6);
    bar.fillStyle(ratio > 0.5 ? 0x38b764 : ratio > 0.25 ? 0xffcd75 : 0xb13e53, 1).fillRect(piece.x - w / 2, piece.y - piece.height / 2 - 8, w * ratio, 4);
    if (piece.getData('camp')) this.onCampHit(hp, destroyed);
    if (destroyed) {
      this.burst(piece.getData('id') === 'stoneWall' ? 'stone' : 'wood', piece.x, piece.y, 18);
      this.cameras.main.shake(120, 0.006);
      sfx.breakWall();
      this.floatText(piece.x, piece.y - 10, 'BROKEN!', '#b13e53');
      bar.destroy();
      piece.destroy();
    }
  }

  onZombieHitsWall(enemy, wall) {
    // Blocked zombies claw at the wall
    // Cooldown per zombie, so a bigger horde really does more damage
    if (!wall.active || !enemy.active || this.time.now < (enemy.getData('nextClaw') ?? 0)) return;
    enemy.setData('nextClaw', this.time.now + 1000);
    sfx.chop();
    this.damageStructure(wall, Math.ceil(enemy.getData('damage') / 3));
  }

  onZombieOnSpikes(enemy, spikes) {
    if (!enemy.active || !spikes.active || this.time.now < (enemy.getData('spikedUntil') ?? 0)) return;
    enemy.setData('spikedUntil', this.time.now + 600);
    this.hurtEnemy(enemy, 2, spikes.x, spikes.y);
    this.damageStructure(spikes, 3);
  }

  // Loot: abandoned cars + supply crates ------------------------------------------

  createLoot() {
    this.lootSpots = [];
    this.lootProgress = 0;
    this.lootTarget = null;
    this.crateTimer = 8000; // first crate soon after the game starts
    this.lootRing = this.add.graphics().setDepth(7000);
    this.crateArrow = this.add.image(0, 0, 'arrow').setScrollFactor(0).setDepth(9700).setVisible(false);
    this.tweens.add({ targets: this.crateArrow, scale: 1.25, duration: 400, yoyo: true, repeat: -1 });
    // Wrecked cars: solid, searchable once
    for (let i = 0; i < 9; i++) {
      const spot = this.randomFreeSpot(80, 220);
      if (!spot || this.lootSpots.some((l) => Phaser.Math.Distance.Between(l.x, l.y, spot.x, spot.y) < 160)) continue;
      const car = this.obstacles.create(spot.x, spot.y, 'car').setDepth(spot.y + 10);
      car.body.setSize(44, 16, true);
      this.lootSpots.push({ sprite: car, x: spot.x, y: spot.y, tier: 'car', opened: false });
    }
  }

  spawnCrate() {
    const blockers = this.placementBlockers();
    for (let attempt = 0; attempt < 15; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Phaser.Math.Between(260, 620);
      const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 40, WORLD_WIDTH - 40);
      const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 60, WORLD_HEIGHT - 40);
      if (!isFree(centeredRect(x, y, 40, 40), blockers)) continue;
      const tier = crateTier(Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y));
      const shadow = this.add.image(x, y + 12, 'shadow').setScale(0.2).setDepth(y - 1);
      const sprite = this.add.image(x, y - 220, 'crate').setDepth(y + 10);
      if (tier === 'rare') sprite.setTint(0xffe08a);
      const crate = { sprite, shadow, x, y, tier, opened: false, crate: true };
      this.lootSpots.push(crate);
      // Falls from the sky with a parachute-less thud
      this.tweens.add({ targets: shadow, scale: 1.4, duration: 900 });
      this.tweens.add({
        targets: sprite,
        y,
        duration: 900,
        ease: 'Bounce.out',
        onComplete: () => {
          this.burst('wood', x, y + 8, 10);
          sfx.build();
          // Guards: day zombies lurking around the drop (more around rare crates)
          const guards = tier === 'rare' ? 3 : 1;
          for (let g = 0; g < guards; g++) this.spawnGuard(x, y);
        },
      });
      this.ui()?.toast(tier === 'rare' ? 'RARE SUPPLY DROP!' : 'Supply drop spotted');
      return crate;
    }
    return null;
  }

  spawnGuard(x, y) {
    const angle = Math.random() * Math.PI * 2;
    const gx = x + Math.cos(angle) * 50;
    const gy = y + Math.sin(angle) * 50;
    const before = this.enemies.countActive(true);
    this.spawnEnemy('zombie', { ...getDifficulty(this.state.elapsed / 1000), isNight: false }, { x: gx, y: gy });
    return this.enemies.countActive(true) > before;
  }

  updateLoot(dt) {
    if (!this.state.isNight) {
      this.crateTimer -= dt;
      const active = this.lootSpots.filter((l) => l.crate && !l.opened).length;
      if (this.crateTimer <= 0 && active < LOOT.maxCrates) {
        this.crateTimer = LOOT.crateEveryMs;
        this.spawnCrate();
      }
    }
    // Hold still next to a crate/car to search it
    const px = this.player.x;
    const py = this.player.y + 12;
    let target = null;
    let best = 40;
    for (const spot of this.lootSpots) {
      if (spot.opened || (spot.crate && spot.sprite.y < spot.y - 1)) continue;
      const d = Phaser.Math.Distance.Between(px, py, spot.x, spot.y + 4);
      if (d < best) {
        best = d;
        target = spot;
      }
    }
    if (target !== this.lootTarget) {
      this.lootTarget = target;
      this.lootProgress = 0;
    }
    this.lootRing.clear();
    if (target) {
      this.lootProgress += dt;
      const p = Math.min(1, this.lootProgress / LOOT.openMs);
      this.lootRing.lineStyle(5, 0x1a1c2c, 0.8).strokeCircle(target.x, target.y - 26, 11);
      this.lootRing.lineStyle(3, 0xffcd75, 1).beginPath();
      this.lootRing.arc(target.x, target.y - 26, 11, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2);
      this.lootRing.strokePath();
      if (p >= 1) this.openLoot(target);
    }
    this.updateCrateArrow();
  }

  openLoot(spot) {
    spot.opened = true;
    this.lootTarget = null;
    this.lootRing.clear();
    const loot = rollLoot(spot.tier);
    // No more beams: they come as extra wood
    loot.wood += loot.beams * 2;
    loot.beams = 0;
    this.state.wood += loot.wood;
    this.state.stone += loot.stone;
    this.state.beams += loot.beams;
    this.state.bonusSouls += loot.souls;
    if (loot.food) this.state.hunger = eat(this.state.hunger, HUNGER.berryFood * loot.food);
    if (loot.heal) this.state.hp = Math.min(this.state.maxHp, this.state.hp + loot.heal);
    this.state.lootOpened += 1;
    const label = pixelText(this, spot.x, spot.y - 34, lootLabel(loot), 11, spot.tier === 'common' ? '#ffcd75' : '#a7f070').setDepth(9800);
    this.tweens.add({ targets: label, y: spot.y - 70, alpha: 0, delay: 900, duration: 1200, onComplete: () => label.destroy() });
    this.emitters.spark.explode(18, spot.x, spot.y);
    this.cameras.main.flash(120, 255, 205, 117);
    sfx.upgrade();
    if (spot.crate) {
      spot.sprite.setTexture('crateOpen').clearTint();
      this.tweens.add({ targets: [spot.sprite, spot.shadow], alpha: 0, delay: 2500, duration: 600, onComplete: () => {
        spot.sprite.destroy();
        spot.shadow.destroy();
        this.lootSpots = this.lootSpots.filter((l) => l !== spot);
      } });
    } else {
      spot.sprite.setTexture('carLooted');
    }
  }

  // Edge-of-screen arrow towards the nearest unopened crate
  updateCrateArrow() {
    const cam = this.cameras.main;
    let nearest = null;
    let best = Infinity;
    for (const spot of this.lootSpots) {
      if (!spot.crate || spot.opened) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y);
      if (d < best) {
        best = d;
        nearest = spot;
      }
    }
    let tint = nearest?.tier === 'rare' ? 0xa7f070 : 0xffffff;
    if (this.state.isNight && this.camp?.active) {
      nearest = this.camp;
      tint = 0xff4d4d;
    }
    const visible = nearest && !Phaser.Geom.Rectangle.Contains(cam.worldView, nearest.x, nearest.y);
    this.crateArrow.setVisible(Boolean(visible));
    if (!visible) return;
    const sx = this.player.x - cam.scrollX;
    const sy = this.player.y - cam.scrollY;
    const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
    const x = Phaser.Math.Clamp(sx + Math.cos(angle) * 150, 24, GAME_WIDTH - 24);
    const y = Phaser.Math.Clamp(sy + Math.sin(angle) * 230, 110, GAME_HEIGHT - 110);
    this.crateArrow.setPosition(x, y).setRotation(angle + Math.PI / 2).setTint(tint);
  }

  // Camp: what you defend. The horde attacks it at night; if it falls, the run is over.
  createCamp() {
    const x = WORLD_WIDTH / 2;
    const y = WORLD_HEIGHT / 2;
    // Clear anything that spawned on the camp site
    for (const n of this.nodes) {
      if (Math.abs(n.x - x) < 160 && Math.abs(n.y - y) < 140) {
        n.depleted = true;
        if (n.sprite.body) n.sprite.body.enable = false;
        n.sprite.setVisible(false);
      }
    }
    const maxHp = Math.round(CAMP_HP * this.meta.structureHpMultiplier);
    this.camp = this.walls.create(x, y, 'camp');
    this.camp.setData({ id: 'camp', camp: true, hp: maxHp, maxHp, nextHit: 0 }).setDepth(y + 16);
    this.add.image(x, y + 18, 'shadow').setScale(2.4, 1.6).setDepth(y - 1);
    this.nextCampAlert = 0;
    this.fortifyCamp(x, y);
    this.state.campMaxHp = maxHp;
  }

  // Free starter palisade around the camp, with a 2-door gate at the bottom
  fortifyCamp(cx, cy) {
    const piece = (id, x, y, angle) => {
      this.buildAngle = angle;
      const recipe = BUILD_RECIPES[id];
      const p = this.groupsByKind[recipe.kind].create(x, y, this.structureKey(id));
      const max = Math.round(STARTER_FENCE_HP * this.meta.structureHpMultiplier); // sturdier than player-built walls
      p.setData({ id, hp: max, maxHp: max }).setDepth(y + p.height / 2);
    };
    for (const dx of [-72, -24, 24, 72]) {
      piece('wall', cx + dx, cy - 84, 0);
      piece(Math.abs(dx) < 48 ? 'door' : 'wall', cx + dx, cy + 84, 0);
    }
    for (const dy of [-48, 0, 48]) {
      piece('wall', cx - 105, cy + dy, 90);
      piece('wall', cx + 105, cy + dy, 90);
    }
    this.buildAngle = 0;
  }

  onCampHit(hp, destroyed) {
    this.state.campHp = hp;
    if (destroyed) {
      this.camp.getData('bar')?.destroy();
      this.ui()?.banner('THE CAMP HAS FALLEN');
      this.time.delayedCall(10, () => this.gameOver('camp'));
      return;
    }
    if (this.time.now > this.nextCampAlert) {
      this.nextCampAlert = this.time.now + 6000;
      this.ui()?.toast('CAMP UNDER ATTACK!');
      sfx.warning();
    }
  }

  // Permanent upgrades bought with souls in the menu
  withMeta(stats) {
    const c = this.cardMods;
    return {
      ...stats,
      maxHp: stats.maxHp + this.meta.maxHpBonus + c.maxHp,
      damage: stats.damage + this.meta.damageBonus + c.damage,
      fireInterval: Math.round(stats.fireInterval * c.fireIntervalMultiplier),
      projectiles: stats.projectiles + c.projectiles,
      speed: Math.round(stats.speed * c.speedMultiplier),
      range: Math.round(stats.range * c.rangeMultiplier),
    };
  }

  // Souls are banked even when you die: that's what makes 'one more run' worth it
  awardSouls() {
    const souls = computeSouls(this.state) + this.state.bonusSouls;
    saveMeta(addSouls(loadMeta(), souls));
    return souls;
  }

  // Level-up cards ------------------------------------------------------------------

  onKillCards(enemy, type) {
    // XP
    const r = addXp(this.state.level, this.state.xp, XP_PER_KILL[type] ?? 1);
    this.state.level = r.level;
    this.state.xp = r.xp;
    if (r.levelsGained > 0) {
      this.state.pendingLevelUps += r.levelsGained;
      sfx.levelUp();
      this.floatText(this.player.x, this.player.y - 30, 'LEVEL UP!', '#c792ea');
      this.ui()?.queueLevelUp();
    }
    // Bloodlust
    if (this.cardMods.healPerKill) this.state.hp = Math.min(this.state.maxHp, this.state.hp + this.cardMods.healPerKill);
    // Volatile Dead: corpses explode and hurt nearby zombies
    const blast = this.cardMods.explodeDamage;
    if (blast > 0) {
      const x = enemy.x;
      const y = enemy.y;
      this.emitters.spark.explode(14, x, y);
      this.burst('hurt', x, y, 10);
      sfx.breakWall();
      const victims = this.enemies.getChildren().filter((e) => e.active && e !== enemy && Phaser.Math.Distance.Between(e.x, e.y, x, y) < 48);
      this.time.delayedCall(60, () => victims.forEach((v) => this.hurtEnemy(v, blast, x, y)));
    }
  }

  // Called from the UI when the player picks a card
  pickCard(id) {
    if (!CARDS[id] || this.state.pendingLevelUps <= 0) return;
    this.state.pendingLevelUps -= 1;
    this.cards[id] = (this.cards[id] ?? 0) + 1;
    this.cardMods = cardModifiers(this.cards);
    const oldMax = this.stats.maxHp;
    this.stats = this.withMeta(computeStats(this.levels));
    if (this.stats.maxHp > oldMax) {
      this.state.maxHp = this.stats.maxHp;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + (this.stats.maxHp - oldMax));
    }
    // Mason: existing structures get the HP boost too
    if (id === 'mason') {
      for (const s of this.allStructures()) {
        const max = Math.round(s.getData('maxHp') * 1.4);
        s.setData('maxHp', max).setData('hp', Math.min(max, s.getData('hp') * 1.4));
      }
    }
    sfx.upgrade();
  }

  repairStructures(amount) {
    for (const s of this.allStructures()) {
      const hp = s.getData('hp');
      const max = s.getData('maxHp');
      if (hp >= max) continue;
      s.setData('hp', Math.min(max, hp + amount));
      if (s.getData('hp') >= max) {
        s.getData('bar')?.destroy();
        s.setData('bar', null);
      }
    }
  }

  // Upgrades (called from UI) ---------------------------------------------------

  tryBuy(id) {
    const result = buyUpgrade(id, this.levels, { wood: this.state.wood, stone: this.state.stone });
    if (!result.ok) return false;
    const oldMax = this.stats.maxHp;
    this.levels = result.levels;
    this.state.wood = result.resources.wood;
    this.state.stone = result.resources.stone;
    this.stats = this.withMeta(computeStats(this.levels));
    if (this.stats.maxHp > oldMax) {
      this.state.maxHp = this.stats.maxHp;
      this.state.hp = Math.min(this.state.maxHp, this.state.hp + 20);
    }
    sfx.upgrade();
    return true;
  }

  // End ---------------------------------------------------------------------

  gameOver(reason = 'died') {
    if (this.state.over) return;
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
      souls: this.awardSouls(),
      reason,
    };
    this.time.delayedCall(900, () => {
      this.scene.stop('UI');
      this.scene.launch('GameOver', result);
    });
  }
}
