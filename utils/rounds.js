// 集齐轮次显示：★=1轮，☾=5轮，☀=25轮，从高到低。
function roundsText(rounds) {
  const n = Math.max(0, parseInt(rounds, 10) || 0);
  if (!n) return '';
  const sun = Math.floor(n / 25);
  const moon = Math.floor((n % 25) / 5);
  const star = n % 5;
  let text = '☀'.repeat(sun) + '☾'.repeat(moon) + '★'.repeat(star);
  // 极端高轮次时收成最高单位 + 数字，避免卡片被撑爆
  if (text.length > 8) {
    if (sun) return '☀' + sun;
    if (moon) return '☾' + moon;
    return '★' + star;
  }
  return text;
}

module.exports = { roundsText };
