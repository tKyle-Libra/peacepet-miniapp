const LEVELS = [
  { index: 1, name: '试吃新手', min: 0 },
  { index: 2, name: '见习买手', min: 300 },
  { index: 3, name: '上手买手', min: 1000 },
  { index: 4, name: '资深买手', min: 3000 },
  { index: 5, name: '选品主任', min: 8000 },
  { index: 6, name: '品控主管', min: 16000 },
  { index: 7, name: '首席买手', min: 30000 },
  { index: 8, name: '宠物美食家', min: 45000 },
  { index: 9, name: '美食评论员', min: 65000 },
  { index: 10, name: '品鉴师', min: 90000 },
  { index: 11, name: '选品顾问', min: 120000 },
  { index: 12, name: '严选顾问', min: 160000 }
];

function levelRows() {
  return LEVELS.map(function (lv) {
    return {
      index: lv.index,
      name: lv.name,
      min: lv.min,
      pad: (lv.index < 10 ? '0' : '') + lv.index
    };
  });
}

module.exports = { LEVELS: LEVELS, levelRows: levelRows };
