Page({
  data: {
    checking: true,
    loggingIn: false,
    error: ''
  },

  onLoad() {
    this.checkSession();
    // 先静默建立抖音 session；getUserInfo 依赖有效 session
    tt.login({
      success: (res) => { if (res && res.code) this.loginCode = res.code; },
      fail: () => {},
    });
  },

  onShow() {
    if (!this.data.loggingIn) this.checkSession();
  },

  checkSession() {
    const app = getApp();
    if (app.hasValidSession()) {
      tt.reLaunch({ url: '/pages/list/list' });
      return;
    }
    this.setData({ checking: false });
  },

  onLogin() {
    if (this.data.loggingIn) return;

    // bindtap 独家接管手势；getUserProfile 必须在这里同步调用
    tt.getUserProfile({
      success: (res) => {
        const p = (res && res.userInfo) || {};
        console.log('[login] getUserProfile ok=', JSON.stringify(p));
        this.doLogin(String(p.nickName || '').trim(), String(p.avatarUrl || '').trim());
      },
      fail: (err) => {
        console.log('[login] getUserProfile fail=', JSON.stringify(err || {}));
        this.doLogin('', '');
      },
    });
  },

  doLogin(nickname, avatarUrl) {
    if (this._loginStarted) return;
    this._loginStarted = true;
    this.setData({ loggingIn: true, error: '' });
    getApp().login({ nickname, avatar_url: avatarUrl }, this.loginCode).then(() => {
      tt.reLaunch({ url: '/pages/list/list' });
    }).catch((err) => {
      this._loginStarted = false;
      this.setData({
        loggingIn: false,
        error: (err && err.message) || '登录失败，请重试'
      });
    });
  }
});
