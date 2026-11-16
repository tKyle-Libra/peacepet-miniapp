function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function hexToHsl(hex) {
  let s = String(hex || '').replace('#', '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return { h: 50, s: 0.7, l: 0.56 };
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: h, s: sat, l: l };
}

// 图鉴口味色提亮：锁 L=56%，收缩饱和度；色相不变。
function brighten(hex) {
  const c = hexToHsl(hex);
  let h = c.h;
  let s = clamp(c.s, 0.64, 0.84);
  if (h >= 50 && h <= 95) s = Math.min(s, 0.72);
  if (h >= 235 && h <= 295) s = Math.min(s, 0.76);
  let l = 0.56;
  // 与品牌黄 #FFE600 色相接近的，避免跟黄色糊在一起
  if (h >= 35 && h <= 70) l -= 0.04;
  return 'hsl(' + Math.round(h) + ', ' + Math.round(s * 100) + '%, ' + Math.round(l * 100) + '%)';
}

const UNSTARTED = '#E6DFD0';

function displayFlavorColor(f) {
  if (!f) return UNSTARTED;
  return f.color_matched ? f.color : brighten(f.color);
}

module.exports = { brighten: brighten, displayFlavorColor: displayFlavorColor, UNSTARTED: UNSTARTED };
