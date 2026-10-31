import { OUTLINE } from './palette';
import { svgDocument, type SvgPart } from './svg';

/** A plain cartoon football (no brand pattern). */
export function ballSvg(size = 90): SvgPart {
  const r = size / 2 - OUTLINE / 2;
  const c = size / 2;
  const patch = (a: number, d: number, s: number) => {
    const cx = c + Math.cos(a) * d;
    const cy = c + Math.sin(a) * d;
    const pts = Array.from({ length: 5 }, (_, i) => {
      const t = a + (i * 2 * Math.PI) / 5;
      return `${(cx + Math.cos(t) * s).toFixed(1)},${(cy + Math.sin(t) * s).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${pts}" fill="#0B1A3A"/>`;
  };
  const patches = [patch(0, 0, r * 0.32), ...Array.from({ length: 5 }, (_, i) => patch(-Math.PI / 2 + (i * 2 * Math.PI) / 5, r * 0.82, r * 0.26))].join('');
  const body = `<defs><clipPath id="b"><circle cx="${c}" cy="${c}" r="${r}"/></clipPath></defs>
<circle cx="${c}" cy="${c}" r="${r}" fill="#FFFFFF"/>
<g clip-path="url(#b)">${patches}</g>
<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#000" stroke-width="${OUTLINE}"/>`;
  return { svg: svgDocument(size, size, body), width: size, height: size, pivotX: c, pivotY: c };
}
