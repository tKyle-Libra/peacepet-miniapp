const api = require('../../utils/api');
const { decorateReceipt } = require('../../utils/receipts');

Page({
  data: {
    loading: true,
    error: '',
    receipts: [],
    total: 0,
    page: 1,
    hasMore: false,
    flavorId: 0,
    flavorName: ''
  },

  onLoad(options) {
    this.flavorId = Number((options && options.flavor) || 0) || 0;
    this.flavorName = String((options && options.flavor_name) || '').trim();
    if (this.flavorName) {
      try { this.flavorName = decodeURIComponent(this.flavorName); } catch (e) {}
    }
    if (!this.flavorId) {
      this.setData({ loading: false, error: '口味参数无效' });
      return;
    }
    this.setData({ flavorId: this.flavorId, flavorName: this.flavorName });
    if (this.flavorName) {
      tt.setNavigationBarTitle({ title: this.flavorName + ' · 相关小票' });
    }
    this.load(1);
  },

  load(page) {
    if (this.data.loading && page > 1) return Promise.resolve();
    this.setData({ loading: true, error: '' });
    return api.getReceipts(page, 20, this.flavorId).then((body) => {
      const d = (body && body.data) || {};
      const rows = (d.receipts || []).map(decorateReceipt);
      const list = page === 1 ? rows : this.data.receipts.concat(rows);
      this.setData({
        loading: false,
        receipts: list,
        total: d.total || 0,
        page: d.page || page,
        hasMore: !!d.has_more
      });
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  retry() {
    this.load(1);
  },

  onPullDownRefresh() {
    this.load(1).finally(() => tt.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.load(this.data.page + 1);
  },

  openReceipt(e) {
    const id = e.currentTarget.dataset.id;
    if (id) tt.navigateTo({ url: '/pages/detail/detail?id=' + id });
  }
});
