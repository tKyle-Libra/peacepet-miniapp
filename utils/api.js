// 生产环境请换成 HTTPS 域名，并在抖音开发者后台配置 request 合法域名
const BASE_URL = 'http://120.55.61.58/api/v1';
const DEVICE_KEY = 'peacepet_receipt_device_id';

function deviceId() {
  let id = tt.getStorageSync(DEVICE_KEY);
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    tt.setStorageSync(DEVICE_KEY, id);
  }
  return id;
}

function rawRequest(path, method, data, needAuth) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    if (needAuth) {
      const token = getApp().globalData.token;
      if (token) header.Authorization = 'Bearer ' + token;
    }
    tt.request({
      url: BASE_URL + path,
      method: method || 'GET',
      data: data || {},
      header,
      timeout: 10000,
      success(res) {
        const body = res.data || {};
        if (res.statusCode === 401 || body.code === 401) {
          const err = new Error(body.msg || '登录已过期');
          err.statusCode = 401;
          reject(err);
          return;
        }
        if (res.statusCode === 403 || body.code === 403) {
          const err = new Error(body.msg || '无权查看');
          err.statusCode = 403;
          reject(err);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(body.msg || ('请求失败 ' + res.statusCode)));
          return;
        }
        resolve(body);
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '网络错误'));
      }
    });
  });
}

function withAuth(path, method, data) {
  const app = getApp();
  if (!app.hasValidSession()) {
    app.goLogin();
    return Promise.reject(new Error('请先登录'));
  }
  return rawRequest(path, method, data, true).catch((err) => {
    if (err.statusCode === 401) {
      // token 失效：清掉本地 token，回登录页，不在后台静默重登
      app.goLogin();
    }
    throw err;
  });
}

function login(profile, presetCode) {
  const send = (code) => {
    if (!code) return Promise.reject(new Error('抖音登录失败'));
    const payload = { code, device_id: deviceId() };
    if (profile && profile.nickname) payload.nickname = String(profile.nickname);
    if (profile && profile.avatar_url) payload.avatar_url = String(profile.avatar_url);
    return rawRequest('/auth/login', 'POST', payload, false).then((body) => {
      if (!body || body.code !== 0 || !body.data || !body.data.token) {
        throw new Error((body && body.msg) || '登录失败');
      }
      return body.data;
    });
  };
  if (presetCode) return send(presetCode);
  return new Promise((resolve, reject) => {
    tt.login({
      success(res) { send(res.code || '').then(resolve).catch(reject); },
      fail(err) { reject(new Error((err && err.errMsg) || '抖音登录失败')); }
    });
  });
}

function getReceipts(page, pageSize, flavorId) {
  let path = '/receipts?page=' + (page || 1) + '&page_size=' + (pageSize || 20);
  if (flavorId) path += '&flavor=' + encodeURIComponent(flavorId);
  return withAuth(path, 'GET');
}

function getProfile() {
  return withAuth('/user/profile', 'GET');
}

function getCatalogOverview(pet) {
  return withAuth('/catalog/overview' + (pet ? '?pet=' + pet : ''), 'GET');
}

function getCatalogBrands(sort, pet) {
  const q = [];
  if (sort && sort !== 'all') q.push('sort=' + encodeURIComponent(sort));
  if (pet === 'cat' || pet === 'dog') q.push('pet=' + pet);
  return withAuth('/catalog/brands' + (q.length ? '?' + q.join('&') : ''), 'GET');
}

function getCatalogNearly(pet) {
  return withAuth('/catalog/nearly' + (pet ? '?pet=' + pet : ''), 'GET');
}

function getCatalogCompleted(pet) {
  return withAuth('/catalog/completed' + (pet ? '?pet=' + pet : ''), 'GET');
}

function getCatalogProducts(sort, pet) {
  const q = [];
  if (sort && sort !== 'all') q.push('sort=' + encodeURIComponent(sort));
  if (pet === 'cat' || pet === 'dog') q.push('pet=' + pet);
  return withAuth('/catalog/products' + (q.length ? '?' + q.join('&') : ''), 'GET');
}

function getCatalogBrand(id, pet) {
  return withAuth('/catalog/brand/' + id + (pet ? '?pet=' + pet : ''), 'GET');
}

function getCatalogFlavor(id) {
  return withAuth('/catalog/flavor/' + id, 'GET');
}

function getUserLevel() {
  return withAuth('/user/level', 'GET');
}

function saveProfile(profile) {
  return withAuth('/user/profile', 'POST', profile);
}

function getReceipt(id) {
  return withAuth('/receipts/' + id, 'GET');
}

function getPackPending() {
  return withAuth('/pack/pending', 'GET');
}

function ackPack() {
  return withAuth('/pack/ack', 'POST');
}

function claimReceipt(date, last6) {
  return withAuth('/receipts/claim', 'POST', { date, last6 });
}

function money(cents) {
  const n = Number(cents || 0) / 100;
  return (n < 0 ? '-' : '') + '¥' + Math.abs(n).toFixed(2);
}

function shortDate(date) {
  if (!date) return '';
  const p = String(date).split('-');
  if (p.length !== 3) return date;
  return p[0] + '年' + Number(p[1]) + '月' + Number(p[2]) + '日';
}

module.exports = { BASE_URL, login, getReceipts, getReceipt, claimReceipt, getProfile, getUserLevel, getCatalogOverview, getCatalogBrands, getCatalogProducts, getCatalogNearly, getCatalogCompleted, getCatalogBrand, getCatalogFlavor, getPackPending, ackPack, saveProfile, money, shortDate };
