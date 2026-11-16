const api = require('../../utils/api');
const palette = require('../../utils/color');
const { iconFor } = require('../../utils/flavor_icon');
const { roundsText } = require('../../utils/rounds');
const { fmtProductName } = require('../../utils/product_name');

Page({
  data: {
    tab: 'brand',
    filter: 'all',
    filters: [
      { key: 'all', label: '全部' },
      { key: 'new', label: '新' },
      { key: 'hot', label: '热' }
    ],
    loading: true,
    error: '',
    overview: null,
    brands: [],
    products: [],
    brandTotal: 0,
    productTotal: 0,
    listCount: 0,
    listUnit: '个品牌',
    topLabel: '已收集口味',
    topNum: '—',
    topDen: '',
    topPct: 0,
    topReady: false,
    topSubMain: '',
    topSubRest: '',
    pet: 'cat',
    iconErrors: {},
    progressMode: 'nearly',
    nearly: null,
    completed: null,
    progressLoading: false,
    progressError: ''
  },

  onShow() {
    if (this.petReady) {
      if (this.data.tab === 'progress') this.loadProgress(this.data.progressMode);
      else this.loadCurrent();
      return;
    }
    const saved = tt.getStorageSync('peacepet_catalog_pet');
    if (saved === 'cat' || saved === 'dog') {
      this.petReady = true;
      this.petChosen = true;
      this.setData({ pet: saved }, () => {
        if (this.data.tab === 'progress') this.loadProgress(this.data.progressMode);
        else this.loadCurrent();
      });
      return;
    }
    api.getCatalogOverview().then((body) => {
      const data = (body && body.data) || {};
      const pet = data.pet_preference === 'dog' ? 'dog' : 'cat';
      this.petReady = true;
      this.petChosen = true;
      try { tt.setStorageSync('peacepet_catalog_pet', pet); } catch (e) {}
      this.setData({ pet: pet }, () => {
        if (this.data.tab === 'progress') this.loadProgress(this.data.progressMode);
        else this.loadCurrent();
      });
    }).catch(() => {
      this.petReady = true;
      this.setData({ pet: 'cat' }, () => this.loadCurrent());
    });
  },

  switchPet(e) {
    const pet = e.currentTarget.dataset.pet;
    if (!pet || pet === this.data.pet) return;
    this.setData({ pet: pet });
    try { tt.setStorageSync('peacepet_catalog_pet', pet); } catch (e) {}
    if (this.data.tab === 'progress') {
      this.loadOverview(pet).then(() => this.loadProgress(this.data.progressMode));
    } else {
      this.loadCurrent();
    }
    tt.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  decorateBrands(raw) {
    return (raw || []).map((b) => {
      const complete = b.total_cells > 0 && b.lit_cells >= b.total_cells;
      const unstarted = b.lit_cells === 0;
      const preview = (b.preview_flavors || []).map((f) => Object.assign({}, f, {
        color: f.color,
        display_lit: !!(f.lit && f.ready),
        icon_url: '/assets/icons-flavor-png/3x/' + iconFor(f.flavor_id, f.name) + '.png'
      }));
      const litNames = preview.filter((f) => f.display_lit).slice(0, 2).map((f) => f.name).join(' · ');
      return Object.assign({}, b, {
        display_name: b.name,
        state: complete ? 'complete' : (unstarted ? 'unstarted' : 'collecting'),
        preview_flavors: preview,
        lit_names: litNames || '还没点亮任何一个',
        more_count: Math.max(0, (b.total_cells || 0) - preview.length),
        segments: (b.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: seg.lit ? palette.brighten(seg.color) : palette.UNSTARTED
        })),
        display_segments: (b.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: (seg.lit && !unstarted) ? palette.displayFlavorColor(seg) : palette.UNSTARTED
        }))
      });
    });
  },

  decorateProducts(raw) {
    return (raw || []).map((p) => {
      const preview = (p.preview_flavors || []).map((f) => Object.assign({}, f, {
        display_lit: !!(f.lit && f.ready),
        icon_url: '/assets/icons-flavor-png/3x/' + iconFor(f.flavor_id, f.name) + '.png'
      }));
      const rounds = Number(p.completed_rounds || 0);
      const stars = roundsText(rounds);
      const unstarted = p.lit === 0;
      return Object.assign({}, p, {
        display_name: fmtProductName(p.name),
        preview_flavors: preview,
        display_segments: (p.segments || []).map((seg) => Object.assign({}, seg, {
          display_color: (seg.lit && !unstarted) ? palette.brighten(seg.color) : palette.UNSTARTED
        })),
        completed_rounds: rounds,
        star_text: stars,
        is_complete: p.state === 'complete' || (p.total > 0 && p.lit >= p.total),
        is_unstarted: p.lit === 0
      });
    });
  },

  updateTop() {
    const o = this.data.overview || {};
    const tab = this.data.tab;
    let label = '已收集口味';
    let num, den, pct, subMain = '', subRest = '';
    if (tab === 'brand') {
      num = o.lit_cells; den = o.total_cells;
      pct = o.progress_pct != null ? o.progress_pct : (den ? 100 * num / den : 0);
      subMain = (o.total_brands != null ? o.total_brands : '—') + ' 个品牌';
      subRest = ' · ' + Math.round(pct || 0) + '%';
    } else if (tab === 'product') {
      label = '已收集口味';
      num = o.lit_cells; den = o.total_cells;
      pct = o.progress_pct != null ? o.progress_pct : (den ? 100 * num / den : 0);
      subMain = (o.total_products != null ? o.total_products : '—') + ' 个产品';
      subRest = ' · ' + Math.round(pct || 0) + '%';
    } else {
      label = '已收集口味';
      num = o.lit_cells;
      den = o.total_cells;
      pct = o.progress_pct != null ? o.progress_pct : (den ? 100 * num / den : 0);
      subMain = (o.total_brands != null ? o.total_brands : '—') + ' 个品牌';
      subRest = ' · ' + (o.total_products != null ? o.total_products : '—') + ' 个产品';
    }
    const ready = num != null && den != null && !isNaN(num) && !isNaN(den) && Number(den) > 0;
    this.setData({
      topLabel: label,
      topNum: ready ? String(num) : '—',
      topDen: ready ? String(den) : '',
      topPct: ready ? Math.max(0, Math.min(100, Math.round(pct))) : 0,
      topReady: ready,
      topSubMain: subMain,
      topSubRest: ready ? subRest : ''
    });
  },

  setCount(tab) {
    if (tab === 'product') {
      this.setData({ listCount: this.data.productTotal || 0, listUnit: '个产品' });
    } else {
      this.setData({ listCount: this.data.brandTotal || 0, listUnit: '个品牌' });
    }
  },

  loadOverview(pet) {
    return api.getCatalogOverview(pet).then((ov) => {
      this.setData({ overview: (ov && ov.data) || null });
      this.updateTop();
    }).catch(() => Promise.resolve());
  },

  loadCurrent() {
    const tab = this.data.tab;
    if (tab === 'progress') return Promise.resolve();
    const sort = 'newall';
    this.setData({ loading: true, error: '' });
    if (tab === 'brand') {
      return Promise.all([api.getCatalogOverview(this.data.pet), api.getCatalogBrands(sort, this.data.pet)])
        .then(([ov, br]) => {
          const overview = (ov && ov.data) || null;
          if (!this.petChosen) {
            const pref = (overview && overview.pet_preference === 'dog') ? 'dog' : 'cat';
            this.petChosen = true;
            try { tt.setStorageSync('peacepet_catalog_pet', pref); } catch (e) {}
            if (pref !== this.data.pet) {
              this.setData({ pet: pref }, () => this.loadCurrent());
              return;
            }
          }
          const body = (br && br.data) || {};
          const brands = this.decorateBrands(body.brands);
          const total = body.all_total || (overview && overview.total_brands) || brands.length;
          this.setData({
            loading: false,
            overview: overview,
            brands: brands,
            brandTotal: total
          });
          this.updateTop();
        })
        .catch((err) => {
          this.setData({ loading: false, error: (err && err.message) || '加载失败' });
        });
    }
    return Promise.all([api.getCatalogOverview(this.data.pet), api.getCatalogProducts(sort, this.data.pet)]).then(([ov, body]) => {
      const overview = (ov && ov.data) || null;
      const d = (body && body.data) || {};
      const products = this.decorateProducts(d.products);
      const total = d.all_total || d.total || products.length;
      this.setData({ loading: false, overview: overview, products: products, productTotal: total });
      this.updateTop();
    }).catch((err) => {
      this.setData({ loading: false, error: (err && err.message) || '加载失败' });
    });
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (!tab || tab === this.data.tab) return;
    this.setData({ tab: tab });
    this.updateTop();
    if (tab === 'progress') this.loadProgress(this.data.progressMode);
    else this.loadCurrent();
    tt.pageScrollTo({ scrollTop: 0, duration: 0 });
  },

  switchProgressMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.progressMode) return;
    this.setData({ progressMode: mode });
    this.loadProgress(mode);
  },

  loadProgress(mode) {
    const key = mode === 'completed' ? 'completed' : 'nearly';
    this.setData({ progressLoading: true, progressError: '' });
    const fn = key === 'completed' ? api.getCatalogCompleted : api.getCatalogNearly;
    return fn(this.data.pet).then((body) => {
      const d = (body && body.data) || { brands: [], products: [] };
      d.brands = (d.brands || []).map((x) => this.decorateProgressItem(
        Object.assign({}, x, {
          remaining: Math.max(0, (x.total_cells || 0) - (x.lit_cells || 0))
        }), 'brand'));
      d.products = (d.products || []).map((x) => this.decorateProgressItem(
        Object.assign({}, x, {
          remaining: Math.max(0, (x.total_cells || 0) - (x.lit_cells || 0))
        }), 'product'));
      const patch = { progressLoading: false };
      patch[key] = d;
      this.setData(patch);
    }).catch((err) => {
      this.setData({ progressLoading: false, progressError: (err && err.message) || '加载失败' });
    });
  },

  decorateProgressItem(x, kind) {
    const preview = (x.preview_flavors || []).map((f) => Object.assign({}, f, {
      display_lit: !!(f.lit && f.ready),
      icon_url: '/assets/icons-flavor-png/3x/' + iconFor(f.flavor_id, f.name) + '.png'
    }));
    const total = kind === 'brand' ? (x.total_cells || 0) : (x.total || x.total_cells || 0);
    const lit = kind === 'brand' ? (x.lit_cells || 0) : (x.lit || x.lit_cells || 0);
    const rounds = Number(x.completed_rounds || 0);
    const stars = kind === 'product' ? roundsText(rounds) : '';
    const displaySegments = (x.segments || []).map((seg) => Object.assign({}, seg, {
      display_color: (seg.lit && lit > 0)
        ? (kind === 'brand' ? palette.displayFlavorColor(seg) : palette.brighten(seg.color))
        : palette.UNSTARTED
    }));
    return Object.assign({}, x, {
      display_name: kind === 'product' ? fmtProductName(x.name) : x.name,
      preview_flavors: preview,
      display_segments: displaySegments,
      display_lit: lit,
      display_total: total,
      completed_rounds: rounds,
      star_text: stars,
      is_complete: total > 0 && lit === total
    });
  },

  openProgressBrand(e) {
    const id = e.currentTarget.dataset.id;
    if (id) tt.navigateTo({ url: '/pages/catalog/brand?id=' + id + '&pet=' + this.data.pet });
  },

  openProgressProduct(e) {
    const ds = e.currentTarget.dataset || {};
    if (!ds.brand || !ds.id) return;
    if (String(ds.ready) === '0' || ds.ready === 0 || ds.ready === false) {
      tt.showToast({ title: '口味暂未开放，快让 PP 去补全口味吧', icon: 'none', duration: 2600 });
      return;
    }
    tt.navigateTo({ url: '/pages/catalog/flavors?brand=' + ds.brand + '&product=' + ds.id + '&pet=' + this.data.pet });
  },

  setFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter: filter });
    this.loadCurrent();
  },

  retry() {
    this.loadCurrent();
  },

  onIconError(e) {
    const id = e.currentTarget.dataset.id;
    if (id == null) return;
    const errors = Object.assign({}, this.data.iconErrors);
    errors[id] = true;
    this.setData({ iconErrors: errors });
  },

  openBrand(e) {
    const id = e.currentTarget.dataset.id;
    if (id) tt.navigateTo({ url: '/pages/catalog/brand?id=' + id + '&pet=' + this.data.pet });
  },

  openProduct(e) {
    const ds = e.currentTarget.dataset || {};
    if (!ds.brand || !ds.id) return;
    if (String(ds.ready) === '0' || ds.ready === 0 || ds.ready === false) {
      tt.showToast({ title: '口味暂未开放，快让 PP 去补全口味吧', icon: 'none', duration: 2600 });
      return;
    }
    tt.navigateTo({ url: '/pages/catalog/flavors?brand=' + ds.brand + '&product=' + ds.id + '&pet=' + this.data.pet });
  }
});
