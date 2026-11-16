function fmtProductName(name) {
  const s = String(name || '').trim();
  if (!s) return s;
  return /系列$/.test(s) ? s : s + '系列';
}

module.exports = { fmtProductName };
