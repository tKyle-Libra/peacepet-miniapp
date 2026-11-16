const api = require('../../utils/api');

Page({
  data: {
    date: '',
    last6: '',
    submitting: false,
    error: '',
    hint: ''
  },

  onLoad() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.setData({ date: y + '-' + m + '-' + day });
  },

  graphToast() {
    tt.showToast({ title: '图鉴功能开发中', icon: 'none', duration: 1800 });
  },

  goBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) tt.navigateBack();
    else tt.reLaunch({ url: '/pages/list/list' });
  },

  onDate(e) { this.setData({ date: e.detail.value, error: '' }); },

  onTail(e) {
    const v = String(e.detail.value || '').replace(/\D/g, '').slice(0, 6);
    this.setData({ last6: v, error: '' });
  },

  submit() {
    if (this.data.submitting) return;
    const date = this.data.date;
    const last6 = this.data.last6;
    if (!date) { this.setData({ error: '请选择购买日期' }); return; }
    if (!/^\d{6}$/.test(last6)) { this.setData({ error: '请输入小票后 6 位数字' }); return; }
    this.setData({ submitting: true, error: '', hint: '' });
    api.claimReceipt(date, last6).then((body) => {
      const d = (body && body.data) || {};
      const result = d.result;
      if (result === 'OK') {
        tt.showToast({ title: '认领成功', icon: 'success' });
        setTimeout(() => tt.reLaunch({ url: '/pages/list/list' }), 700);
      } else if (result === 'ALREADY_CLAIMED_SELF') {
        tt.showToast({ title: '这张小票你已经认领过了', icon: 'none' });
        this.setData({ submitting: false });
      } else if (result === 'ALREADY_BOUND') {
        tt.showModal({ title: '该小票已被绑定', content: '如有疑问请联系门店', showCancel: false });
        this.setData({ submitting: false });
      } else if (result === 'NOT_READY') {
        this.setData({ submitting: false, error: '今天的小票明天更新后才能认领，明天再来' });
      } else {
        this.setData({ submitting: false, error: d.message || '没找到这张小票，请核对后 6 位和日期' });
      }
    }).catch((err) => {
      this.setData({ submitting: false, error: (err && err.message) || '认领失败，请稍后重试' });
    });
  }
});
