import { OUTLINE } from '../palette';
import { svgDocument, type SvgPart } from '../svg';

export interface FootballerLook {
  /** Shirt color (CSS). Also used for sleeves and socks unless overridden. */
  shirt: string;
  /** Collar and cuff trim. */
  trim: string;
  shorts: string;
  socks?: string;
  boots: string;
  skin: string;
  hair: string;
  /** Shirt number (drawn by the rig as text, so any font can be used). */
  number: number | string;
}

export const DEFAULT_LOOK: FootballerLook = {
  shirt: '#E63946',
  trim: '#FFFFFF',
  shorts: '#FFFFFF',
  boots: '#111111',
  skin: '#F2C29B',
  hair: '#3B2416',
  number: 10,
};

export type PartName = 'head' | 'hair' | 'hood' | 'torso' | 'shorts' | 'arm' | 'leg' | 'boot';

const O = OUTLINE;
const stroke = `stroke="#000" stroke-width="${O}" stroke-linejoin="round" stroke-linecap="round"`;

/** Head with face; pivot at the neck. */
function head(l: FootballerLook): SvgPart {
  const w = 220;
  const h = 210;
  const cx = 110;
  const cy = 100;
  const body = `
<circle cx="${cx - 92}" cy="${cy + 8}" r="20" fill="${l.skin}" ${stroke}/>
<circle cx="${cx + 92}" cy="${cy + 8}" r="20" fill="${l.skin}" ${stroke}/>
<rect x="${cx - 26}" y="${cy + 70}" width="52" height="36" fill="${l.skin}" ${stroke}/>
<circle cx="${cx}" cy="${cy}" r="90" fill="${l.skin}" ${stroke}/>
<ellipse cx="${cx - 32}" cy="${cy + 2}" rx="17" ry="21" fill="#fff" ${stroke}/>
<ellipse cx="${cx + 32}" cy="${cy + 2}" rx="17" ry="21" fill="#fff" ${stroke}/>
<circle cx="${cx - 28}" cy="${cy + 6}" r="8" fill="#000"/>
<circle cx="${cx + 36}" cy="${cy + 6}" r="8" fill="#000"/>
<circle cx="${cx - 58}" cy="${cy + 38}" r="12" fill="#FF2E88" opacity="0.35"/>
<circle cx="${cx + 58}" cy="${cy + 38}" r="12" fill="#FF2E88" opacity="0.35"/>
<path d="M ${cx - 38} ${cy + 36} Q ${cx} ${cy + 82} ${cx + 38} ${cy + 36} Z" fill="#7A1020" ${stroke}/>
<path d="M ${cx - 24} ${cy + 42} Q ${cx} ${cy + 50} ${cx + 24} ${cy + 42}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: cx, pivotY: cy + 100 };
}

/** Hair cap drawn over the head; same pivot as the head. */
function hair(l: FootballerLook): SvgPart {
  const w = 220;
  const h = 210;
  const cx = 110;
  const cy = 100;
  const body = `<path d="M ${cx - 92} ${cy - 2}
 C ${cx - 98} ${cy - 90}, ${cx + 98} ${cy - 104}, ${cx + 92} ${cy - 6}
 L ${cx + 70} ${cy - 30} L ${cx + 50} ${cy - 18} L ${cx + 30} ${cy - 40} L ${cx + 4} ${cy - 22}
 L ${cx - 20} ${cy - 44} L ${cx - 44} ${cy - 22} L ${cx - 66} ${cy - 36} Z" fill="${l.hair}" ${stroke}/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: cx, pivotY: cy + 100 };
}

/** Shirt pulled over the head (shirt-over-head celebration); same pivot as the head. */
function hood(l: FootballerLook): SvgPart {
  const w = 240;
  const h = 230;
  const cx = 120;
  const body = `<path d="M ${cx - 104} 222 C ${cx - 120} 90, ${cx - 80} 8, ${cx} 8 C ${cx + 80} 8, ${cx + 120} 90, ${cx + 104} 222 Z"
 fill="${l.shirt}" ${stroke}/>
<path d="M ${cx - 70} 200 Q ${cx} 170 ${cx + 70} 200" fill="none" stroke="${l.trim}" stroke-width="12" stroke-linecap="round"/>
<path d="M ${cx - 60} 120 Q ${cx - 30} 100 ${cx} 118 Q ${cx + 30} 100 ${cx + 60} 120" fill="none" stroke="#000" stroke-width="4" opacity="0.5"/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: cx, pivotY: 210 };
}

/** Shirt body; pivot at its center. The number is added by the rig. */
function torso(l: FootballerLook): SvgPart {
  const w = 240;
  const h = 220;
  const body = `<path d="M 30 26 Q 120 4 210 26 L 222 200 Q 120 214 18 200 Z" fill="${l.shirt}" ${stroke}/>
<path d="M 88 14 Q 120 50 152 14" fill="${l.skin}" stroke="${l.trim}" stroke-width="10" stroke-linecap="round"/>
<path d="M 88 14 Q 120 50 152 14" fill="none" ${stroke}/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: 120, pivotY: 110 };
}

function shorts(l: FootballerLook): SvgPart {
  const w = 240;
  const h = 96;
  const body = `<path d="M 22 8 L 218 8 L 228 86 L 132 86 L 120 50 L 108 86 L 12 86 Z" fill="${l.shorts}" ${stroke}/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: 120, pivotY: 48 };
}

/** Arm hanging down; pivot at the shoulder. Sleeve, skin, hand. */
function arm(l: FootballerLook): SvgPart {
  const w = 84;
  const h = 210;
  const body = `<rect x="22" y="20" width="40" height="160" rx="20" fill="${l.skin}" ${stroke}/>
<path d="M 12 30 Q 12 8 42 8 Q 72 8 72 30 L 72 86 L 12 86 Z" fill="${l.shirt}" ${stroke}/>
<rect x="12" y="74" width="60" height="12" fill="${l.trim}" ${stroke}/>
<circle cx="42" cy="182" r="24" fill="${l.skin}" ${stroke}/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: 42, pivotY: 32 };
}

/** Leg hanging down; pivot at the hip. Skin thigh, sock lower half. */
function leg(l: FootballerLook): SvgPart {
  const w = 76;
  const h = 180;
  const socks = l.socks ?? l.shirt;
  const body = `<rect x="14" y="8" width="48" height="164" rx="18" fill="${l.skin}" ${stroke}/>
<path d="M 14 86 L 62 86 L 62 154 Q 62 172 38 172 Q 14 172 14 154 Z" fill="${socks}" ${stroke}/>
<rect x="14" y="86" width="48" height="12" fill="${l.trim}" ${stroke}/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: 38, pivotY: 22 };
}

/** Boot pointing right; pivot at the ankle. */
function boot(l: FootballerLook): SvgPart {
  const w = 110;
  const h = 64;
  const body = `<path d="M 16 10 L 58 10 Q 70 28 92 30 Q 104 32 104 46 L 104 52 L 10 52 Z" fill="${l.boots}" ${stroke}/>
<circle cx="40" cy="24" r="4" fill="#fff"/><circle cx="52" cy="28" r="4" fill="#fff"/>
<path d="M 20 58 L 26 58 M 46 58 L 52 58 M 78 58 L 84 58" stroke="#000" stroke-width="6" stroke-linecap="round"/>`;
  return { svg: svgDocument(w, h, body), width: w, height: h, pivotX: 36, pivotY: 16 };
}

export function footballerParts(look: FootballerLook): Record<PartName, SvgPart> {
  return {
    head: head(look),
    hair: hair(look),
    hood: hood(look),
    torso: torso(look),
    shorts: shorts(look),
    arm: arm(look),
    leg: leg(look),
    boot: boot(look),
  };
}

/** Stable texture-key suffix for a look, so different team colors get their own textures. */
export function lookKey(look: FootballerLook): string {
  const text = JSON.stringify({ ...look, number: '' });
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
