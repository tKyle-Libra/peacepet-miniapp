const api = require('./api');

const SESSION_KEY = 'peacepet_track_session';
const ALLOWED_PROPS = ['id', 'brand_id', 'product_id', 'flavor_id', 'receipt_id', 'type',
  'tab', 'pet', 'index', 'status', 'result', 'source', 'count', 'rank', 'from', 'to',
  'page_size', 'is_last'];

let session = null;
let queue = [];
let timer = null;
let currentPage = '';
let previousPage = '';
let hiddenAt = 0;

function uuid() {
  return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

function newSession() {
  return { id: 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10),
    startedAt: Date.now() };
}

function init() {
  // 每次启动新 session；切后台超过 30 分钟再换
  session = newSession();
  try { tt.setStorageSync(SESSION_KEY, session); } catch (e) {}
  queue = [];
  currentPage = '';
  previousPage = '';
  hiddenAt = 0;
}

function ensureSession() {
  if (!session) session = newSession();
  return session;
}

function userId() {
  try {
    const app = getApp();
    return Number((app && app.globalData && app.globalData.userId) || 0) || 0;
  } catch (e) {
    return 0;
  }
}

function cleanProps(props) {
  const out = {};
  if (!props || typeof props !== 'object') return out;
  ALLOWED_PROPS.forEach((k) => {
    const v = props[k];
    if (v === undefined) return;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    }
  });
  return out;
}

function enqueue(event, opts) {
  ensureSession();
  const o = opts || {};
  const props = cleanProps(o.props);
  queue.push({
    event_id: uuid(),
    event: event,
    session_id: session.id,
    user_id: userId(),
    page: o.page || currentPage || '',
    ref: o.ref || '',
    target: o.target === undefined || o.target === null ? '' : String(o.target),
    props: props,
    client_ts: Date.now()
  });
  if (queue.length >= 8) flush();
  else if (!timer) timer = setTimeout(flush, 4000);
}

function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!queue.length) return;
  const events = queue.splice(0, 10);
  try {
    tt.request({
      url: api.BASE_URL + '/track',
      method: 'POST',
      data: { events: events },
      timeout: 3000,
      success() {},
      fail() {}
    });
  } catch (e) {}
}

function pageShow(page, opts) {
  if (!page) return;
  flush();
  const o = opts || {};
  const ref = o.ref !== undefined ? o.ref : currentPage;
  previousPage = currentPage;
  currentPage = page;
  enqueue('page_view', { page: page, ref: ref || '', props: o.props || {} });
}

function event(name, opts) {
  enqueue(name, opts || {});
}

function appHide() {
  hiddenAt = Date.now();
  flush();
}

function appShow() {
  if (hiddenAt && Date.now() - hiddenAt > 30 * 60 * 1000) init();
  hiddenAt = 0;
}

module.exports = { init, pageShow, event, flush, appHide, appShow, userId };
