// 口味象形图标：主料优先，同级左起最长匹配。
// 特殊处理：羊奶/牛奶/鸡蛋等复合词是“主料本身”，应压过其中的动物字。
const MEAT = [
  { kw: '火鸡肉', icon: 'chicken' },
  { kw: '鸡肉', icon: 'chicken' },
  { kw: '鸭肉', icon: 'duck' },
  { kw: '鹅肉', icon: 'duck' },
  { kw: '兔肉', icon: 'rabbit' },
  { kw: '牛肉', icon: 'cow' },
  { kw: '羊肉', icon: 'sheep' },
  { kw: '猪肉', icon: 'pig' },
  { kw: '鹿肉', icon: 'deer' },
  { kw: '鱼肉', icon: 'fish' },
  { kw: '三文鱼', icon: 'fish' },
  { kw: '金枪鱼', icon: 'fish' },
  { kw: '沙丁鱼', icon: 'fish' },
  { kw: '鳕鱼', icon: 'fish' },
  { kw: '鲑鱼', icon: 'fish' },
  { kw: '磷虾', icon: 'fish' },
  { kw: '贻贝', icon: 'fish' },
  { kw: '海鲜', icon: 'fish' },
  { kw: '鱼油', icon: 'fish' },
  { kw: '火鸡', icon: 'chicken' },
  { kw: '鹌鹑', icon: 'chicken' },
  { kw: '鸽', icon: 'chicken' },
  { kw: '鸡', icon: 'chicken' },
  { kw: '鸭', icon: 'duck' },
  { kw: '鹅', icon: 'duck' },
  { kw: '兔', icon: 'rabbit' },
  { kw: '牛', icon: 'cow' },
  { kw: '犊', icon: 'cow' },
  { kw: '羊', icon: 'sheep' },
  { kw: '羔', icon: 'sheep' },
  { kw: '猪', icon: 'pig' },
  { kw: '鹿', icon: 'deer' },
  { kw: '鱼', icon: 'fish' },
  { kw: '虾', icon: 'fish' },
  { kw: '蟹', icon: 'fish' },
  { kw: '贝', icon: 'fish' }
];

const DAIRY_EGG_BONE = [
  { kw: '鹌鹑蛋', icon: 'egg' },
  { kw: '鸡蛋', icon: 'egg' },
  { kw: '蛋黄', icon: 'egg' },
  { kw: '羊奶', icon: 'milk' },
  { kw: '羊乳', icon: 'milk' },
  { kw: '牛奶', icon: 'milk' },
  { kw: '牛乳', icon: 'milk' },
  { kw: '酸奶', icon: 'milk' },
  { kw: '奶酪', icon: 'milk' },
  { kw: '芝士', icon: 'milk' },
  { kw: '黄油', icon: 'milk' },
  { kw: '软骨素', icon: 'bone' },
  { kw: '蛋', icon: 'egg' },
  { kw: '奶', icon: 'milk' },
  { kw: '乳', icon: 'milk' },
  { kw: '骨', icon: 'bone' },
  { kw: '钙', icon: 'bone' }
];

const PLANT = [
  { kw: '大麦若叶', icon: 'carrot' },
  { kw: '羽衣甘蓝', icon: 'carrot' },
  { kw: '胡萝卜', icon: 'carrot' },
  { kw: '西兰花', icon: 'carrot' },
  { kw: '甘蓝', icon: 'carrot' },
  { kw: '菠菜', icon: 'carrot' },
  { kw: '蔬菜', icon: 'carrot' },
  { kw: '番茄', icon: 'carrot' },
  { kw: '芦笋', icon: 'carrot' },
  { kw: '青瓜', icon: 'carrot' },
  { kw: '南瓜', icon: 'pumpkin' },
  { kw: '蔓越莓', icon: 'berry' },
  { kw: '巴西莓', icon: 'berry' },
  { kw: '奇异果', icon: 'berry' },
  { kw: '草莓', icon: 'berry' },
  { kw: '蓝莓', icon: 'berry' },
  { kw: '树莓', icon: 'berry' },
  { kw: '桑葚', icon: 'berry' },
  { kw: '黑莓', icon: 'berry' },
  { kw: '苹果', icon: 'berry' },
  { kw: '桃', icon: 'berry' },
  { kw: '梨', icon: 'berry' },
  { kw: '木瓜', icon: 'berry' },
  { kw: '凤梨', icon: 'berry' },
  { kw: '椰子', icon: 'berry' },
  { kw: '水果', icon: 'berry' },
  { kw: '莓', icon: 'berry' }
];

// 这些复合词虽然含动物字，但整体就是主料，长度更长时压过动物。
const COMPOUND = {};
['羊奶', '羊乳', '牛奶', '牛乳', '酸奶', '奶酪', '芝士', '黄油',
 '鸡蛋', '蛋黄', '鹌鹑蛋'].forEach((k) => { COMPOUND[k] = true; });

function findBest(s, rules) {
  for (let i = 0; i < s.length; i++) {
    let best = null;
    for (let j = 0; j < rules.length; j++) {
      const r = rules[j];
      if (s.startsWith(r.kw, i) && (!best || r.kw.length > best.len)) {
        best = { icon: r.icon, len: r.kw.length, kw: r.kw };
      }
    }
    if (best) return best;
  }
  return null;
}

function matchIcon(name) {
  const s = String(name || '').trim();
  const meat = findBest(s, MEAT);
  const dairy = findBest(s, DAIRY_EGG_BONE);

  // 羊奶/鸡蛋/鹌鹑蛋等：复合词更长时优先于动物字。
  if (dairy && COMPOUND[dairy.kw] && (!meat || dairy.len > meat.len)) return dairy.icon;
  // 第一优先级：肉 / 禽 / 鱼
  if (meat) return meat.icon;
  // 第二优先级：奶 / 蛋 / 骨
  if (dairy) return dairy.icon;
  // 第三优先级：水果 / 蔬菜 / 南瓜
  const plant = findBest(s, PLANT);
  return plant ? plant.icon : 'paw';
}

const cache = {};
function iconFor(flavorId, name) {
  const key = String(flavorId || name || '');
  if (!cache[key]) cache[key] = matchIcon(name);
  return cache[key];
}

module.exports = { matchIcon, iconFor };
