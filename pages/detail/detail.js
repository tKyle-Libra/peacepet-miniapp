const api = require('../../utils/api');
const levels = require('../../utils/level');

Page({
  data: { loading: true, error: '', receipt: null, items: [], level: null, levelGap: 0, levelRows: levels.levelRows(),
    levelMembers: 0, showLevel: false, levelScrollInto: '' },

  onLoad(options) {
    this.saleId = Number(options.id || 0);
    this.loadLevel();
    this.load();
  },

  onHide() {
    this.setData({ showLevel: false });
  },

  onUnload() {
    this.setData({ showLevel: false });
  },

  loadLevel() {
    return api.getUserLevel().then((body) => {
      const d = (body && body.data) || {};
      const level = d || null;
      const gap = level && level.level_index < 12 ? Math.max(0, 100 - (level.progress_pct || 0)) : 0;
      const byIndex = {};
      (d.level_rows || []).forEach((r) => { byIndex[r.index] = r; });
      const rows = levels.levelRows().map((r) => Object.assign({}, r, {
        achieved_at: (byIndex[r.index] && byIndex[r.index].achieved_at) || '',
        achieved_members: (byIndex[r.index] && byIndex[r.index].achieved_members) || 0
      }));
      const current = byIndex[level && level.level_index];
      this.setData({ level: level, levelGap: gap, levelRows: rows,
        levelMembers: (current && current.achieved_members) || 0 });
    }).catch(() => {
      this.setData({ level: null, levelGap: 0 });
    });
  },

  load() {
    if (!this.saleId) {
      this.setData({ loading: false, error: '小票参数无效' });
      return;
    }
    this.setData({ loading: true, error: '' });
    api.getReceipt(this.saleId).then((body) => {
      const r = (body.data || {}).receipt || null;
      if (!r) throw new Error('小票不存在');
      const items = (r.items || []).map((it) => Object.assign({}, it, {
        price_text: api.money(it.unit_price_cents),
        amount_text: api.money(it.amount_cents),
        meta: [it.brand, it.product, it.flavor].filter(Boolean).join(' · ')
      }));
      this.setData({
        loading: false,
        receipt: Object.assign({}, r, {
          pay_text: api.money(r.pay_cents),
          total_text: api.money(r.total_cents),
          discount_text: api.money(r.discount_cents),
          date_text: api.shortDate(r.date),
          is_refund: r.sale_type === 'refund'
        }),
        items
      });
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  openLevel() {
    if (!this.data.level) return;
    const idx = this.data.level.level_index;
    // 只有当前等级靠下时才自动滚；Lv.1~Lv.6 保持从 01 开始展示
    this.setData({ showLevel: true, levelScrollInto: idx >= 7 ? 'lv-' + idx : '' });
  },

  closeLevel() {
    this.setData({ showLevel: false });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) tt.navigateBack();
    else tt.reLaunch({ url: '/pages/list/list' });
  },

  graphTap() {
    tt.showToast({ title: '图鉴功能开发中', icon: 'none', duration: 1800 });
  }
});
