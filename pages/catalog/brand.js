const api = require('../../utils/api');
const track = require('../../utils/track');
const palette = require('../../utils/color');
const { iconFor } = require('../../utils/flavor_icon');
const { roundsText } = require('../../utils/rounds');
const { fmtProductName } = require('../../utils/product_name');

Page({
  data: {
    loading: true,
    error: '',
    brand: null,
    products: [],
    sort: 'all',
    iconErrors: {},
    chips: [
      { key: 'all', label: '全部' },
      { key: 'close', label: '差一点' },
      { key: 'unlit', label: '未点亮' }
    ]
  },

  onLoad(options) {
    this.brandId = Number(options.id || 0);
    this.focusProductId = Number((options && options.product) || 0) || 0;
    this.pet = (options && (options.pet === 'cat' || options.pet === 'dog')) ? options.pet : '';
    this.load();
  },

  onShow() {
    track.pageShow('brand', { target: this.brandId || '' });
  },

  onHide() { track.flush(); },

  onUnload() { track.flush(); },

  load() {
    if (!this.brandId) {
      this.setData({ loading: false, error: '品牌参数无效' });
      return;
    }
    this.setData({ loading: true, error: '' });
    return api.getCatalogBrand(this.brandId, this.pet).then((body) => {
      const data = (body && body.data) || {};
      const brand = data.brand || null;
      if (brand) {
        const mb = Number(brand.member_buyers || 0);
        brand.member_text = mb >= 5 ? ('已有 ' + mb + ' 位会员买过这个品牌')
          : (mb > 0 ? '已有会员买过这个品牌' : '还没有会员买过这个品牌，你可以是第一个');
        brand.segments = (brand.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: seg.lit ? palette.displayFlavorColor(seg) : palette.UNSTARTED
        }));
      }
      const products = (data.products || []).map((p) => {
        const unstarted = p.lit_count === 0;
        const preview = (p.preview_flavors || []).map((f) => Object.assign({}, f, {
          display_lit: !!(f.lit && f.ready),
          icon_url: '/assets/icons-flavor-png/3x/' + iconFor(f.flavor_id, f.name) + '.png'
        }));
        const rounds = Number(p.completed_rounds || 0);
        const stars = roundsText(rounds);
        return Object.assign({}, p, {
          display_name: fmtProductName(p.name),
          preview_flavors: preview,
          completed_rounds: rounds,
          star_text: stars,
          state: p.is_complete ? 'complete' : (unstarted ? 'unstarted' : 'collecting'),
          segments: (p.segments || []).map((seg) => Object.assign({}, seg, {
            display_color: (seg.lit && !unstarted) ? palette.displayFlavorColor(seg) : palette.UNSTARTED
          })),
          display_segments: (p.segments || []).map((seg) => Object.assign({}, seg, {
            display_color: (seg.lit && !unstarted) ? palette.displayFlavorColor(seg) : palette.UNSTARTED
          }))
        });
      });
      this.rawProducts = products.slice();
      this.setData({ loading: false, brand: brand });
      this.applySort(this.data.sort);
      if (data.brand && data.brand.name) {
        tt.setNavigationBarTitle({ title: data.brand.name + ' · 图鉴' });
      }
      if (this.focusProductId) {
        setTimeout(() => {
          try {
            tt.pageScrollTo({ selector: '#product-' + this.focusProductId, duration: 250, offsetTop: -8 });
          } catch (e) {}
        }, 120);
      }
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  onIconError(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    const errors = Object.assign({}, this.data.iconErrors);
    errors[id] = true;
    this.setData({ iconErrors: errors });
  },

  retry() {
    this.load();
  },

  setSort(e) {
    const sort = e.currentTarget.dataset.sort;
    if (!sort) return;
    this.setData({ sort });
    this.applySort(sort);
  },

  applySort(sort) {
    let list = (this.rawProducts || []).slice();
    if (sort === 'close') {
      // 慢一点：还剩 1~3 个口味；默认按剩余数、点亮率排
      list = list.filter((p) => {
        const left = (p.flavor_count || 0) - (p.lit_count || 0);
        return !p.is_complete && left >= 1 && left <= 3;
      });
      list.sort((a, b) => {
        const ar = a.flavor_count - a.lit_count;
        const br = b.flavor_count - b.lit_count;
        if (ar !== br) return ar - br;
        return b.progress_pct - a.progress_pct;
      });
    } else if (sort === 'unlit') {
      // 未点亮：一个都没买的产品
      list = list.filter((p) => (p.lit_count || 0) === 0);
      list.sort((a, b) => {
        if (a.flavor_count !== b.flavor_count) return a.flavor_count - b.flavor_count;
        return (a.name || '').localeCompare(b.name || '');
      });
    } else {
      // 全部：默认按点亮率从高到低
      list.sort((a, b) => {
        if (a.is_complete !== b.is_complete) return a.is_complete ? -1 : 1;
        if (b.progress_pct !== a.progress_pct) return b.progress_pct - a.progress_pct;
        return b.lit_count - a.lit_count;
      });
    }
    this.setData({ products: list });
  },

  productTap(e) {
    const ds = e.currentTarget.dataset || {};
    const id = ds.id;
    if (!id || !this.brandId) return;
    track.event('product_click', { page: 'brand', target: String(id),
      props: { brand_id: this.brandId, source: 'brand', status: (String(ds.ready) === '1' ? 'ready' : 'unready') } });
    if (String(ds.ready) === '0' || ds.ready === 0 || ds.ready === false) {
      tt.showToast({ title: '口味暂未开放，快让 PP 去补全口味吧', icon: 'none', duration: 2600 });
      return;
    }
    tt.navigateTo({ url: '/pages/catalog/flavors?brand=' + this.brandId + '&product=' + id + (this.pet ? '&pet=' + this.pet : '') });
  }
});
