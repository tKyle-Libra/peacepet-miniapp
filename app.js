const api = require('./utils/api');

const SESSION_KEY = 'peacepet_receipt_session';
const DEVICE_KEY = 'peacepet_receipt_device_id';

App({
  globalData: {
    token: '',
    expiresAt: 0
  },

  onLaunch() {
    // 不自动登录；只恢复本地登录态。首次进入由登录页决定。
    this.restoreSession();
  },

  restoreSession() {
    try {
      const raw = tt.getStorageSync(SESSION_KEY);
      const session = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      if (session && session.token && Number(session.expiresAt) > Date.now()) {
        this.globalData.token = session.token;
        this.globalData.expiresAt = Number(session.expiresAt);
        return true;
      }
    } catch (e) {
      console.warn('restore session failed', e);
    }
    this.clearSession();
    return false;
  },

  saveSession(res) {
    const expiresIn = Number(res.expires_in || 7200);
    const expiresAt = Date.now() + Math.max(60, expiresIn - 120) * 1000;
    this.globalData.token = res.token;
    this.globalData.expiresAt = expiresAt;
    tt.setStorageSync(SESSION_KEY, { token: res.token, expiresAt });
  },

  clearSession() {
    this.globalData.token = '';
    this.globalData.expiresAt = 0;
    try { tt.removeStorageSync(SESSION_KEY); } catch (e) {}
  },

  hasValidSession() {
    if (!this.globalData.token) return false;
    if (this.globalData.expiresAt <= Date.now()) {
      this.clearSession();
      return false;
    }
    return true;
  },

  login(profile, code) {
    return api.login(profile, code).then((res) => {
      this.saveSession(res);
      return res;
    });
  },

  goLogin() {
    this.clearSession();
    tt.reLaunch({ url: '/pages/index/index' });
  }
});
