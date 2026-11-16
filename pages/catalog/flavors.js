const api = require('../../utils/api');
const track = require('../../utils/track');
const palette = require('../../utils/color');
const { iconFor } = require('../../utils/flavor_icon');
const { fmtProductName } = require('../../utils/product_name');

Page({
  data: {
    loading: true,
    error: '',
    brand: null,
    product: null,
    showSheet: false,
    sheetLoading: false,
    sheet: null,
    iconErrors: {},
    sheetIconError: false,
    showUnready: false
  },

  onLoad(options) {
    this.brandId = Number((options && options.brand) || 0);
    this.productId = Number((options && options.product) || 0);
    this.pet = (options && (options.pet === 'cat' || options.pet === 'dog')) ? options.pet : '';
    this.load();
  },

  onIconError(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    const errors = Object.assign({}, this.data.iconErrors);
    errors[id] = true;
    this.setData({ iconErrors: errors });
  },

  onSheetIconError() {
    this.setData({ sheetIconError: true });
  },

  closeUnready() {
    this.setData({ showUnready: false });
  },

  onShow() {
    track.pageShow('flavors', { target: this.productId || '' });
  },

  onHide() {
    track.flush();
    // 页面离开时清弹层，避免遮罩/卡片状态残留
    this.setData({ showSheet: false, sheet: null, sheetLoading: false, showUnready: false });
  },

  onUnload() {
    track.flush();
    this.setData({ showSheet: false, sheet: null, sheetLoading: false, showUnready: false });
  },

  load() {
    if (!this.brandId || !this.productId) {
      this.setData({ loading: false, error: '产品参数无效' });
      return;
    }
    this.setData({ loading: true, error: '' });
    api.getCatalogBrand(this.brandId, this.pet).then((body) => {
      const data = (body && body.data) || {};
      const brand = data.brand || null;
      let product = (data.products || []).filter((p) => Number(p.id) === this.productId)[0] || null;
      if (brand) {
        brand.segments = (brand.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: seg.lit ? palette.displayFlavorColor(seg) : palette.UNSTARTED
        }));
      }
      if (product) {
        product.display_name = fmtProductName(product.name);
        const unstarted = product.lit_count === 0;
        product.segments = (product.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: (seg.lit && !unstarted) ? palette.brighten(seg.color) : palette.UNSTARTED
        }));
        product.flavors = (product.flavors || []).map((f) => Object.assign({}, f, {
          display_color: palette.displayFlavorColor(f),
          display_lit: !!(f.lit && f.is_flavor_ready),
          icon_url: '/assets/icons-flavor-png/3x/' + iconFor(f.id, f.name) + '.png'
        }));
      }
      this.flavorDetails = {};
      if (product) {
        (product.flavors || []).forEach((f) => {
          this.flavorDetails[f.id] = Object.assign({}, f, {
            brand_name: brand ? brand.name : '',
            product_name: product.name || '',
            display_product_name: product.display_name || fmtProductName(product.name)
          });
        });
      }
      this.setData({ loading: false, brand, product });
      if (product && product.display_name) {
        tt.setNavigationBarTitle({ title: product.display_name });
      }
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  retry() {
    this.load();
  },

  prepareSheet(f) {
    const n = Number(f.member_buyers || 0);
    const others = Math.max(0, n - 1);
    if (f.lit) {
      f.social_text = others >= 5 ? ('还有 ' + others + ' 位会员也买过')
        : (others > 0 ? '也有会员买过' : '你是第一个买它的会员');
    } else {
      f.social_text = n >= 5 ? ('已有 ' + n + ' 位会员买过')
        : (n > 0 ? '已有会员买过' : '还没有会员买过');
    }
    f.last_text = f.last_sale_at ? String(f.last_sale_at).slice(0, 10) : '暂无记录';
    f.display_color = palette.displayFlavorColor(f);
    f.icon_url = '/assets/icons-flavor-png/3x/' + iconFor(f.id, f.name) + '.png';
    return f;
  },

  openFlavor(e) {
    const ds = e.currentTarget.dataset || {};
    const id = Number(ds.id || 0);
    const ready = String(ds.ready) === '1' || ds.ready === true || ds.ready === 1;
    if (!id) return;
    track.event('flavor_click', { page: 'flavors', target: String(id),
      props: { product_id: this.productId, status: ready ? 'ready' : 'unready' } });
    if (!ready) {
      this.setData({ showUnready: true, showSheet: false, sheet: null, sheetLoading: false });
      return;
    }
    const local = this.flavorDetails && this.flavorDetails[id];
    if (local) {
      const f = this.prepareSheet(Object.assign({}, local));
      track.event('flavor_sheet_view', { page: 'flavors', target: String(id) });
      this.setData({ showSheet: true, sheetLoading: false, sheet: f, sheetIconError: false });
      return;
    }
    this.setData({ showSheet: true, sheetLoading: true, sheet: null, sheetIconError: false });
    api.getCatalogFlavor(id).then((body) => {
      const f = (body && body.data && body.data.flavor) || null;
      if (!f) throw new Error('口味不存在');
      this.prepareSheet(f);
      track.event('flavor_sheet_view', { page: 'flavors', target: String(id) });
      this.setData({ sheetLoading: false, sheet: f, sheetIconError: false });
    }).catch(() => {
      this.setData({ showSheet: false, sheetLoading: false });
      tt.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  closeSheet() {
    this.setData({ showSheet: false, sheet: null, sheetLoading: false });
  },

  noop() {},

  openReceipts() {
    const f = this.data.sheet;
    if (!f || !f.lit || !f.my_buy_count) return;
    track.event('flavor_receipt_click', { page: 'flavors', target: String(f.id) });
    const name = encodeURIComponent(f.name || '');
    tt.navigateTo({ url: '/pages/flavor-receipts/flavor-receipts?flavor=' + f.id + '&flavor_name=' + name });
  }
});
