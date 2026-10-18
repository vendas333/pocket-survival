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
};

export const SPRITES = {
  player0: [
    '....kkkk....',
    '...khhhhk...',
    '..khhhhhhk..',
    '..kssssssk..',
    '..kskssksk..',
    '..kssssssk..',
    '...kggggk...',
    '..kggyyggk..',
    '..ksggggsk..',
    '...kbbbbk...',
    '...kbkkbk...',
    '...kk..kk...',
  ],
  player1: [
    '....kkkk....',
    '...khhhhk...',
    '..khhhhhhk..',
    '..kssssssk..',
    '..kskssksk..',
    '..kssssssk..',
    '...kggggk...',
    '..kggyyggk..',
    '..ksggggsk..',
    '...kbbbbk...',
    '..kbk..kbk..',
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
  zombie0: [
    '....kkkk....',
    '...kggggk...',
    '..kgGgggGk..',
    '..kgrggrgk..',
    '..kggggggk..',
    '..kkgkkgkk..',
    'kkkbbbbbbkkk',
    'kggbbmbbbggk',
    'kk.kbbbbk.kk',
    '...kddddk...',
    '...kdkkdk...',
    '...kk..kk...',
  ],
  zombie1: [
    '....kkkk....',
    '...kggggk...',
    '..kgGgggGk..',
    '..kgrggrgk..',
    '..kggggggk..',
    '..kkgkkgkk..',
    'kkkbbbbbbkkk',
    'kggbbmbbbggk',
    'kk.kbbbbk.kk',
    '...kddddk...',
    '..kdk..kdk..',
    '..kk....kk..',
  ],
  runner0: [
    '....kkkk....',
    '...knnnnk...',
    '..knnnnnnk..',
    '..knrnnrnk..',
    '..knnkknnk..',
    '...kknnkk...',
    '.kkkrrrrkkk.',
    'knnkrrrrknnk',
    'kk.krrrrk.kk',
    '...kmmmmk...',
    '..kmk..kmk..',
    '.kk......kk.',
  ],
  runner1: [
    '....kkkk....',
    '...knnnnk...',
    '..knnnnnnk..',
    '..knrnnrnk..',
    '..knnkknnk..',
    '...kknnkk...',
    '.kkkrrrrkkk.',
    'knnkrrrrknnk',
    'kk.krrrrk.kk',
    '...kmmmmk...',
    '...kmkkmk...',
    '...kk..kk...',
  ],
  brute0: [
    '...kkkkkk...',
    '..kGGGGGGk..',
    '.kGgGGGGgGk.',
    '.kGrrGGrrGk.',
    '.kGGkkkkGGk.',
    'kkkGGGGGGkkk',
    'kGGkppppkGGk',
    'kGGkpppppkGk',
    'kkkkppppkkkk',
    '..kddkkddk..',
    '..kddk.kddk.',
    '..kkkk.kkkk.',
  ],
  brute1: [
    '...kkkkkk...',
    '..kGGGGGGk..',
    '.kGgGGGGgGk.',
    '.kGrrGGrrGk.',
    '.kGGkkkkGGk.',
    'kkkGGGGGGkkk',
    'kGGkppppkGGk',
    'kGGkpppppkGk',
    'kkkkppppkkkk',
    '..kddkkddk..',
    '.kddk.kddk..',
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
    'g.g.g',
    'gGgGg',
  ],
};

// Rasterise every sprite map into a canvas texture.
export function createSpriteTextures(scene, scale) {
  for (const [key, rows] of Object.entries(SPRITES)) {
    makeTexture(scene, key, rows, scale);
  }
  makeGround(scene, 'ground', 64, 64, scale);
  makeSolid(scene, 'px', 2, 2, '#ffffff');
  makeShadow(scene, 'shadow', 26, 8);
  makeDarkness(scene, 'darkness', 760, 1320, 120);
}

// Night overlay: dark everywhere except a soft circle of light in the centre.
function makeDarkness(scene, key, w, h, radius) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(8,10,28,0.88)';
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
  const shades = ['#3e8948', '#3e8948', '#3e8948', '#438f4c', '#367d40', '#4a9a52'];
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
    ctx.fillStyle = '#2d6b38';
    ctx.fillRect(x * scale, y * scale, scale, scale * 2);
  }
  tex.refresh();
}
