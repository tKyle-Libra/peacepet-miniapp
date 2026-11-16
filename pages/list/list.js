const api = require('../../utils/api');
const track = require('../../utils/track');
const levels = require('../../utils/level');
const { decorateReceipt } = require('../../utils/receipts');

Page({
  data: {
    loading: true,
    error: '',
    receipts: [],
    summaryCounts: { receipts: 0, items: 0, skus: 0, points: 0 },
    summaryPressed: false,
    showMemberHint: false,
    showRule: false,
    // 图鉴已上线，恢复三格汇总条
    showSummary: true,
    dataUpdatedAt: '',
    total: 0,
    page: 1,
    hasMore: false,
    nickname: '',
    avatarUrl: '',
    level: null,
    levelGap: 0,
    levelRows: levels.levelRows(),
    levelMembers: 0,
    showLevel: false,
    levelScrollInto: ''
  },

  onShow() {
    track.pageShow('receipt_list');
    this.load(1);
    this.loadProfile();
    this.loadLevel();
  },

  onHide() {
    track.flush();
    this.closeAllPopups();
  },

  onUnload() {
    track.flush();
    this.closeAllPopups();
  },

  closeAllPopups() {
    this.setData({ showRule: false, showMemberHint: false, showLevel: false });
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

  loadProfile() {
    return api.getProfile().then((body) => {
      const d = (body && body.data) || {};
      const nickname = String(d.nickname || '').trim();
      const avatarUrl = String(d.avatar_url || '').trim();
      if (d.id) getApp().globalData.userId = Number(d.id) || 0;
      this.setData({
        nickname,
        avatarUrl
      });
    }).catch(() => {});
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

  load(page) {
    if (this.data.loading && page > 1) return Promise.resolve();
    this.setData({ loading: true, error: '' });
    return api.getReceipts(page, 20).then((body) => {
      const d = body.data || {};
      const rows = (d.receipts || []).map(decorateReceipt);
      const list = page === 1 ? rows : this.data.receipts.concat(rows);
      this.setData({
        loading: false,
        receipts: list,
        total: d.total || 0,
        page: d.page || page,
        hasMore: !!d.has_more,
        dataUpdatedAt: d.data_updated_at || '',
        summaryCounts: {
          receipts: d.total || 0,
          items: (d.summary && d.summary.total_items) || 0,
          skus: (d.summary && d.summary.total_skus) || 0,
          points: (d.summary && d.summary.member_points) || 0
        }
      });
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  openReceipt(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    track.event('receipt_click', { page: 'receipt_list', target: String(id) });
    tt.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  goCatalog() {
    track.event('catalog_tab', { page: 'receipt_list', props: { tab: 'catalog', from: 'receipt_list' } });
    tt.navigateTo({ url: '/pages/catalog/index' });
  },

  pressSummary() {
    this.setData({ summaryPressed: true });
  },

  releaseSummary() {
    this.setData({ summaryPressed: false });
  },

  goClaim() {
    tt.navigateTo({ url: '/pages/claim/claim' });
  },

  openRule() {
    this.setData({ showRule: true });
  },

  closeRule() {
    this.setData({ showRule: false });
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

  openMemberHint() {
    // 没有可用的直播间跳转链路时，弹出说明，不做假跳转
    this.setData({ showMemberHint: true });
  },

  closeMemberHint() {
    this.setData({ showMemberHint: false });
  },

  graphTap() {
    tt.showToast({ title: '图鉴功能开发中', icon: 'none', duration: 1800 });
  }
});
