// Original pixel-art, defined as character maps and rasterised into textures at boot.
// Palette inspired by a generic 16-colour retro palette (colours only, no external assets).

export const PALETTE = {
  k: '#1a1c2c', // outline
  w: '#f4f4f4',
  s: '#f2c39b', // skin
  h: '#6b3e26', // hair
  g: '#38b764', // green
  G: '#257179', // teal / dark green
  l: '#a7f070', // light green
  b: '#3b5dc9', // blue
  c: '#41a6f6', // cyan
  y: '#ffcd75', // yellow
  o: '#ef7d57', // orange
  r: '#b13e53', // red
  p: '#5d275d', // purple
  P: '#b55088', // magenta
  d: '#333c57', // dark grey
  m: '#566c86', // grey
  n: '#94b0c2', // light grey
  t: '#8a5a3b', // trunk
  T: '#5a3a28', // dark trunk
  f: '#2d5a3a', // forest shade
  z: '#9fa98f', // zombie skin (pale, greyish)
  Z: '#5e6650', // zombie skin shadow / rot
};

export const SPRITES = {
  // Weary survivor: messy dark hair, stubble, grim mouth, dirty olive jacket with a blood stain
  player0: [
    '....kkkk....',
    '...kTTTTk...',
    '..kTTTTTTk..',
    '..kTssssTk..',
    '..kskssksk..',
    '..kZskksZk..',
    '...kffffk...',
    '..kffTrffk..',
    '..ksfTfffk..',
    '...kddddk...',
    '...kdkkdk...',
    '...kk..kk...',
  ],
  player1: [
    '....kkkk....',
    '...kTTTTk...',
    '..kTTTTTTk..',
    '..kTssssTk..',
    '..kskssksk..',
    '..kZskksZk..',
    '...kffffk...',
    '..kffTrffk..',
    '..ksfTfffk..',
    '...kddddk...',
    '..kdk..kdk..',
    '..kk....kk..',
  ],
  slime0: [
    '............',
    '............',
    '............',
    '....kkkk....',
    '..kkllllkk..',
    '.kllllllllk.',
    '.klkwllkwlk.',
    '.klkkllkklk.',
    '.kllllllllk.',
    '.kgllllllgk.',
    '..kggggggk..',
    '...kkkkkk...',
  ],
  slime1: [
    '............',
    '............',
    '............',
    '............',
    '...kkkkkk...',
    '.kkllllllkk.',
    'kllkwllkwllk',
    'kllkkllkkllk',
    'kllllllllllk',
    'kgllllllllgk',
    '.kggggggggk.',
    '..kkkkkkkk..',
  ],
  bat0: [
    '............',
    'k..........k',
    'kk........kk',
    'kPk..kk..kPk',
    'kPPkkppkkPPk',
    'kPPPpppppPPk',
    '.kPpwppwpPk.',
    '..kppppppk..',
    '...kpkkpk...',
    '....k..k....',
    '............',
    '............',
  ],
  bat1: [
    '............',
    '............',
    '............',
    '.....kk.....',
    '....kppk....',
    '.kkkppppkkk.',
    'kPPppwwppPPk',
    'kPPPppppPPPk',
    '.kPPkppkPPk.',
    '..kk.kk.kk..',
    '............',
    '............',
  ],
  skeleton0: [
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kwkwwkwk..',
    '..kwwwwwwk..',
    '...kwkwkk...',
    '..kknwwnkk..',
    '.knkwnnwknk.',
    '.k.knwwnk.k.',
    '...knkknk...',
    '...kn..nk...',
    '...kk..kk...',
  ],
  skeleton1: [
    '....kkkk....',
    '...kwwwwk...',
    '..kwwwwwwk..',
    '..kwkwwkwk..',
    '..kwwwwwwk..',
    '...kwkwkk...',
    '..kknwwnkk..',
    '.knkwnnwknk.',
    '.k.knwwnk.k.',
    '...knkknk...',
    '..kn....nk..',
    '..kk....kk..',
  ],
  golem0: [
    '...kkkkkk...',
    '..kmmmmmmk..',
    '.kmnmmmmnmk.',
    '.kmroommrmk.',
    '.kmmmmmmmmk.',
    'kkmmdmmdmmkk',
    'kmkmmmmmmkmk',
    'kmkmnmmnmkmk',
    'kkkmmmmmmkkk',
    '..kmmkkmmk..',
    '..kmmk.kmmk.',
    '..kkkk.kkkk.',
  ],
  golem1: [
    '...kkkkkk...',
    '..kmmmmmmk..',
    '.kmnmmmmnmk.',
    '.kmroommrmk.',
    '.kmmmmmmmmk.',
    'kkmmdmmdmmkk',
    'kmkmmmmmmkmk',
    'kmkmnmmnmkmk',
    'kkkmmmmmmkkk',
    '..kmmkkmmk..',
    '.kmmk.kmmk..',
    '.kkkk.kkkk..',
  ],
  // Zombies: human silhouettes with pale, rotting skin (z/Z), torn bloody clothes, arms reaching out
  zombie0: [
    '....kkkk....',
    '...khhhhk...',
    '..khzzzhhk..',
    '..kzzzzzzk..',
    '..kZkzzkZk..',
    '..kzzrrzzk..',
    'kkkkwwwwkkkk',
    'kzzwwrwwwzzk',
    'kkkwwwrwwkkk',
    '...kbbbbk...',
    '...kbkkbk...',
    '...kk..kk...',
  ],
  zombie1: [
    '....kkkk....',
    '...khhhhk...',
    '..khzzzhhk..',
    '..kzzzzzzk..',
    '..kZkzzkZk..',
    '..kzzrrzzk..',
    'kkkkwwwwkkkk',
    'kzzwwrwwwzzk',
    'kkkwwwrwwkkk',
    '...kbbbbk...',
    '..kbk..kbk..',
    '..kk....kk..',
  ],
  runner0: [
    '....kkkk....',
    '...kzzzzk...',
    '..kzzZzzzk..',
    '..kzzzzzzk..',
    '..kZkzzkZk..',
    '..kzzkkzzk..',
    'kkkkrrrrkkkk',
    'kzzrrorrrzzk',
    'kkkrrrrrrkkk',
    '...kmmmmk...',
    '..kmk..kmk..',
    '.kk......kk.',
  ],
  runner1: [
    '....kkkk....',
    '...kzzzzk...',
    '..kzzZzzzk..',
    '..kzzzzzzk..',
    '..kZkzzkZk..',
    '..kzzkkzzk..',
    'kkkkrrrrkkkk',
    'kzzrrorrrzzk',
    'kkkrrrrrrkkk',
    '...kmmmmk...',
    '...kmkkmk...',
    '...kk..kk...',
  ],
  brute0: [
    '...kkkkkk...',
    '..kzzzzzzk..',
    '.kzzZzzzZzk.',
    '.kzkkzzkkzk.',
    '.kzzzrrzzzk.',
    'kkkzzzzzzkkk',
    'kzzkddddkzzk',
    'kzzkdrdddkzk',
    'kkkkddddkkkk',
    '..kbbkkbbk..',
    '..kbbk.kbbk.',
    '..kkkk.kkkk.',
  ],
  brute1: [
    '...kkkkkk...',
    '..kzzzzzzk..',
    '.kzzZzzzZzk.',
    '.kzkkzzkkzk.',
    '.kzzzrrzzzk.',
    'kkkzzzzzzkkk',
    'kzzkddddkzzk',
    'kzzkdrdddkzk',
    'kkkkddddkkkk',
    '..kbbkkbbk..',
    '.kbbk.kbbk..',
    '.kkkk.kkkk..',
  ],
  tree: [
    '.....kkkkkk.....',
    '...kkllllllkk...',
    '..klllgllllllk..',
    '.kllgggllgglllk.',
    '.klggggggggglgk.',
    'klgggGgggggggggk',
    'kggggggggGgggggk',
    'kgGggggggggggGgk',
    'kggggGgggggggggk',
    '.kgggggggGggggk.',
    '.kGgggGggggggGk.',
    '..kGGgggggGGGk..',
    '...kkGGGGGGkk...',
    '.....kkttkk.....',
    '......kttk......',
    '......kttk......',
    '......ktTk......',
    '.....kttTTk.....',
    '....kTTkkTTk....',
    '....kk....kk....',
  ],
  stump: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '.....kkkkkk.....',
    '.....kyttyk.....',
    '.....kttTTk.....',
    '....kTTkkTTk....',
    '....kk....kk....',
  ],
  rock: [
    '....kkkkk...',
    '..kknnnnmk..',
    '.knnnwnnmmk.',
    '.knnnnnmmmk.',
    'knnmnnnmmmdk',
    'knmmmnmmmddk',
    'kmmmmmmmdddk',
    '.kdmmmmdddk.',
    '..kkkkkkkk..',
  ],
  pebbles: [
    '............',
    '............',
    '............',
    '............',
    '............',
    '....kkk.....',
    '..kknmmk.kk.',
    '.knmmdkkkmmk',
    '..kkkk..kkk.',
  ],
  bush: [
    '...kkkkkk...',
    '..kggrggggk.',
    '.kgrgggggrgk',
    'kggggglggggk',
    'kgrgggggrggk',
    'kgggglggggGk',
    '.kGgrgggGGk.',
    '..kkGGGGkk..',
    '....kkkk....',
  ],
  bushEmpty: [
    '...kkkkkk...',
    '..kggggggggk',
    '.kgggggggggk',
    'kggggglggggk',
    'kgggggggggGk',
    'kgggglggggGk',
    '.kGgggggGGk.',
    '..kkGGGGkk..',
    '....kkkk....',
  ],
  shot: [
    '.kk.',
    'knnk',
    'knmk',
    '.kk.',
  ],
  wood: [
    '.kkkkk.',
    'kyttttk',
    'ktTtTtk',
    'kyttttk',
    '.kkkkk.',
  ],
  stone: [
    '.kkkk.',
    'knnnmk',
    'knmmmk',
    'kmmmdk',
    '.kkkk.',
  ],
  berry: [
    '..kgk..',
    '.krkrk.',
    'krrwrrk',
    'krrrrrk',
    '.krrrk.',
    '..kkk..',
  ],
  heart: [
    '.kk.kk.',
    'krrkrrk',
    'krwrrrk',
    'krrrrrk',
    '.krrrk.',
    '..krk..',
    '...k...',
  ],
  icon_damage: [
    '....kk..',
    '...knnk.',
    '..knnmk.',
    '.knnmk..',
    'knnmk...',
    'kkmk....',
    'kTk.....',
    'kk......',
  ],
  icon_fire: [
    '....kkk.',
    '...kyyk.',
    '..kyyk..',
    '.kyyyykk',
    'kkkyyyk.',
    '..kyyk..',
    '.kyk....',
    '.kk.....',
  ],
  icon_speed: [
    '..kkk...',
    '..kbbk..',
    '..kbbk..',
    '..kbbkk.',
    '.kkbbbbk',
    'kwkbbbbk',
    'kkkkkkkk',
    '........',
  ],
  icon_heart: [
    '.kk.kk..',
    'krrkrrk.',
    'krwrrrk.',
    'krrrrrk.',
    '.krrrk..',
    '..krk...',
    '...k....',
    '........',
  ],
  icon_multi: [
    'kk......',
    'knk..kk.',
    '.kk.knk.',
    '....kk..',
    '.kk.....',
    'knk..kk.',
    '.kk.knk.',
    '.....kk.',
  ],
  icon_axe: [
    '..kkk...',
    '.knnnk..',
    'knnnkk..',
    'knnkTk..',
    '.kkkTk..',
    '...kTk..',
    '...kTk..',
    '...kkk..',
  ],
  flower: [
    '.y.',
    'ywy',
    '.g.',
  ],
  flower2: [
    '.P.',
    'PyP',
    '.g.',
  ],
  tuft: [
    'f.f.f',
    'fTfTf',
  ],
  beam: [
    'kkkkkkk',
    'kyttttk',
    'ktTtTtk',
    'kkkkkkk',
  ],
  // Plank wall seen from above (horizontal); rotated 90º in game for vertical
  wall: [
    'kkkkkkkkkkkkkkkk',
    'kttTttTttTttTttk',
    'kTtttTtttTtttTtk',
    'kkkkkkkkkkkkkkkk',
    'kttTttTttTttTttk',
    'kkkkkkkkkkkkkkkk',
  ],
  // Survivors' camp: tent + fire (the thing you must protect)
  camp: [
    '......kk..............',
    '.....kook.............',
    '....kooook............',
    '...kooTTook...........',
    '..koooTTooook.....k...',
    '.kooooTkoooook...kyk..',
    'kooooTkkkoooook.kyoyk.',
    'kooooTkkkoooook.koyok.',
    'kkkkkkkkkkkkkkkkkrookk',
    '................kTTTk.',
    '.................kkk..',
  ],
  crate: [
    'kkkkkkkkkk',
    'ktTttttTtk',
    'kTkkwwkkTk',
    'ktkwrrwktk',
    'ktkrrrrktk',
    'ktkwrrwktk',
    'kTkkwwkkTk',
    'ktTttttTtk',
    'kkkkkkkkkk',
  ],
  crateOpen: [
    '..........',
    '..........',
    'kkkkkkkkkk',
    'kT......Tk',
    'kt.kkkk.tk',
    'kt......tk',
    'kTTttttTTk',
    'ktTttttTtk',
    'kkkkkkkkkk',
  ],
  car: [
    '....kkkkkkkk....',
    '...knnkkknnnk...',
    '..kncckmmkccnk..',
    'kkkrrrrrrrrrrkkk',
    'kroorrrTrrrroork',
    'krrrrrTrrrrrrrrk',
    'kTkkkTrrrrTkkkTk',
    'kkdmdkkkkkkdmdkk',
    '..kdk......kdk..',
  ],
  carLooted: [
    '....kkkkkkkk....',
    '...kkkkkkkkkk...',
    '..kkkkkmmkkkkk..',
    'kkkTTTTTTTTTTkkk',
    'kTTTTTTkTTTTTTTk',
    'kTTTTTkTTTTTTTTk',
    'kdkkkdTTTTdkkkdk',
    'kkdmdkkkkkkdmdkk',
    '..kdk......kdk..',
  ],
  arrow: [
    '....k....',
    '...kyk...',
    '..kyyyk..',
    '.kyyyyyk.',
    'kkkyyykkk',
    '...kyk...',
    '...kkk...',
  ],
  stoneWall: [
    'kkkkkkkkkkkkkkkk',
    'knnmknnnmknnmnnk',
    'kmmdkmmmdkmmdmmk',
    'kkkkkkkkkkkkkkkk',
    'knmnnknmnnknmnnk',
    'kkkkkkkkkkkkkkkk',
  ],
  door: [
    'kkkkkkkkkkkkkkkk',
    'kTTkyttttttykTTk',
    'kTTktttTtytTkTTk',
    'kTTkyttttttykTTk',
    'kTTktTttttTtkTTk',
    'kkkkkkkkkkkkkkkk',
  ],
  campfire: [
    '...k.k..',
    '..kyky..',
    '.kyoyok.',
    '.koyooyk',
    'kroooork',
    'kTTkkTTk',
    'kmTTTTmk',
    '.kkkkkk.',
  ],
  spikes: [
    '.k...k...k.',
    'knk.knk.knk',
    'knk.knk.knk',
    'ktk.ktk.ktk',
    'kkkkkkkkkkk',
    'kTTTTTTTTTk',
    'kkkkkkkkkkk',
  ],
  skull: [
    '.kkkk.',
    'kwwwwk',
    'kwkkwk',
    'kwwwwk',
    '.kwwk.',
    '.kkkk.',
  ],
  bones: [
    'kk.....kk',
    'kwk...kwk',
    '.kwk.kwk.',
    '..kwkwk..',
    '.kwk.kwk.',
    'kwk...kwk',
    'kk.....kk',
  ],
  grave: [
    '...kkk...',
    '...knk...',
    '.kkknkkk.',
    '.knnnnnk.',
    '.kkknkkk.',
    '...knk...',
    '...knk...',
    '.kkTTTkk.',
    'kTTTTTTTk',
  ],
  blood: [
    '...r....r...',
    '..rrr..rr...',
    '.rrrrrrrrr..',
    'rrrprrrrrrr.',
    '.rrrrrprrr..',
    '..rr.rrrr.r.',
    '.r....rr....',
  ],
};

// Rasterise every sprite map into a canvas texture.
export function createSpriteTextures(scene, scale) {
  for (const [key, rows] of Object.entries(SPRITES)) {
    makeTexture(scene, key, rows, scale);
  }
  // Vertical versions of rotatable structures (real textures, so physics bodies match exactly)
  for (const key of ['wall', 'stoneWall', 'door', 'spikes']) makeRotated(scene, key);
  makeGround(scene, 'ground', 64, 64, scale);
  makeSolid(scene, 'px', 2, 2, '#ffffff');
  makeShadow(scene, 'shadow', 26, 8);
  makeDarkness(scene, 'darkness', 760, 1320, 120);
  makeLight(scene, 'light', 120);
  makeSolid(scene, 'rain', 1, 8, '#9fb4c8');
  makeFog(scene, 'fog', 192);
}

// Soft, tileable fog blobs
function makeFog(scene, key, size) {
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 18; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 20 + rand() * 40;
    for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      g.addColorStop(0, 'rgba(200,205,215,0.5)');
      g.addColorStop(1, 'rgba(200,205,215,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  tex.refresh();
}

// Soft white circle, erased out of the night overlay around the player and campfires.
function makeLight(scene, key, radius) {
  const size = radius * 2;
  const tex = scene.textures.createCanvas(key, size, size);
  const ctx = tex.getContext();
  const g = ctx.createRadialGradient(radius, radius, radius * 0.35, radius, radius, radius);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

// Night overlay: dark everywhere except a soft circle of light in the centre.
function makeDarkness(scene, key, w, h, radius) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(14,6,10,0.9)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-out';
  const g = ctx.createRadialGradient(w / 2, h / 2, radius * 0.35, w / 2, h / 2, radius);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

export function makeTexture(scene, key, rows, scale) {
  const width = Math.max(...rows.map((r) => r.length));
  const height = rows.length;
  const tex = scene.textures.createCanvas(key, width * scale, height * scale);
  const ctx = tex.getContext();
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = PALETTE[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  tex.refresh();
}

function makeRotated(scene, key) {
  const src = scene.textures.get(key).getSourceImage();
  const tex = scene.textures.createCanvas(`${key}_v`, src.height, src.width);
  const ctx = tex.getContext();
  ctx.translate(src.height, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  tex.refresh();
}

function makeSolid(scene, key, w, h, color) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
}

function makeShadow(scene, key, w, h) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(26,28,44,0.35)';
  ctx.beginPath();
  ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

// Seamless grass tile with deterministic pixel noise (tiles via TileSprite).
function makeGround(scene, key, cols, rows, scale) {
  const tex = scene.textures.createCanvas(key, cols * scale, rows * scale);
  const ctx = tex.getContext();
  let seed = 1337;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  // Dead, muddy grass
  const shades = ['#3d4230', '#3d4230', '#3a3d2c', '#44482f', '#33372a', '#4a4733'];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      ctx.fillStyle = shades[Math.floor(rand() * shades.length)];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  // a few darker blades
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * cols);
    const y = Math.floor(rand() * (rows - 1));
    ctx.fillStyle = '#2a2c22';
    ctx.fillRect(x * scale, y * scale, scale, scale * 2);
  }
  tex.refresh();
}
