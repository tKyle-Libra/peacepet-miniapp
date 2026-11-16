const api = require('../../utils/api');
const track = require('../../utils/track');
const { fmtProductName } = require('../../utils/product_name');

const RARITY = {
  common: { label: '普通', color: '#111111' },
  rare: { label: '稀有', color: '#D98E2B' },
  epic: { label: '史诗', color: '#7C5AC8' },
  legend: { label: '传说', color: '#E0A800' }
};

function pad4(n) {
  const s = String(n || 0);
  return ('0000' + s).slice(-4);
}

Page({
  data: {
    loading: true,
    error: '',
    cards: [],
    index: 0,
    card: null,
    packNo: pad4(Date.now() % 10000),
    acking: false,
    isLast: false
  },

  onLoad() {
    track.pageShow('open_pack');
    this.loadPending();
  },

  onHide() { track.flush(); },

  onUnload() { track.flush(); },

  loadPending() {
    this.setData({ loading: true, error: '' });
    api.getPackPending().then((body) => {
      const data = (body && body.data) || {};
      const cards = (data.cards || []).map((c) => this.decorateCard(c));
      if (!cards.length) {
        this.setData({ loading: false, cards: [], card: null, error: '这批卡包已经看过了' });
        return;
      }
      this.setData({ loading: false, cards, index: 0, card: cards[0], isLast: cards.length === 1 });
      track.event('pack_card_view', { page: 'open_pack', target: cards[0].type,
        props: { index: 0, is_last: cards.length === 1 } });
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '卡包加载失败' });
    });
  },

  decorateCard(card) {
    const rarity = RARITY[card.rarity] || RARITY.common;
    const type = card.type;
    let name = '';
    let subtitle = '';
    if (type === 'flavor') {
      name = (card.flavor && card.flavor.name) || '新口味';
      subtitle = [card.flavor && card.flavor.product_name, card.flavor && card.flavor.brand_name].filter(Boolean).join(' · ');
    } else if (type === 'flavors') {
      name = '新口味 × ' + ((card.flavors || []).length || 0);
      subtitle = '这一批点亮的新口味';
    } else if (type === 'product') {
      name = fmtProductName(card.product && card.product.name);
      subtitle = (card.brand_name || '') + ' · 集齐产品';
    } else if (type === 'brand') {
      name = (card.brand && card.brand.name) || '集齐品牌';
      subtitle = '集齐品牌 · 全部口味';
    } else if (type === 'level') {
      name = 'Lv.' + ((card.level && card.level.index) || '') + ' ' + ((card.level && card.level.name) || '');
      subtitle = '等级升级';
    } else {
      name = card.title || '新的收集';
    }
    const animalKeys = (card.animal_keys && card.animal_keys.length)
      ? card.animal_keys
      : (card.animal_key ? [card.animal_key] : ['cat_三花猫']);
    const animals = animalKeys.map((key) => ({
      key: key,
      url: '/assets/pets/800/' + key + '.png'
    }));
    return Object.assign({}, card, {
      display_name: name,
      subtitle: subtitle,
      brand_name: card.brand_name || (card.brand && card.brand.name) || 'PEACEPET',
      brand_color: card.brand_color || '#FFE600',
      animal_list: animals,
      prop_url: '/assets/props/' + (card.prop_key || '09-meat') + '.png'
    });
  },

  next() {
    if (!this.data.card) return;
    if (this.data.isLast) { this.finish(); return; }
    const next = this.data.index + 1;
    const nextIsLast = next >= this.data.cards.length - 1;
    this.setData({
      index: next,
      card: this.data.cards[next],
      isLast: nextIsLast
    });
    track.event('pack_card_view', { page: 'open_pack', target: this.data.cards[next].type,
      props: { index: next, is_last: nextIsLast } });
  },

  close() {
    track.event('pack_skip', { page: 'open_pack', props: { index: this.data.index } });
    this.finish();
  },

  finish() {
    if (this.data.acking) return;
    track.event('pack_finish', { page: 'open_pack', props: { index: this.data.index,
      count: this.data.cards.length } });
    this.setData({ acking: true });
    api.ackPack().then(() => {
      this.goBack();
    }).catch(() => {
      // ack 失败不吞卡：下次进入还能再看一遍
      this.setData({ acking: false });
      tt.showToast({ title: '网络不好，稍后再试', icon: 'none' });
    });
  },

  goBack() {
    // 收下/跳过都回图鉴首页
    tt.reLaunch({ url: '/pages/catalog/index' });
  }
});
