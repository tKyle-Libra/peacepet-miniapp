# peacepet-miniapp

PeacePet 抖音小程序：电子小票 + 图鉴 + 等级。

## 页面

```
pages/list        小票列表（三格汇总：小票数 / 已集齐商品 / 积分）
pages/detail      小票详情（不显示任何金额，只有品名与数量）
pages/claim       认领小票
pages/catalog/index     图鉴首页（品牌 / 产品 / 我的 三视角 + 猫狗切换）
pages/catalog/brand     品牌页
pages/catalog/flavors   口味墙（产品详情）
pages/flavor-receipts   某口味的相关小票
```

## 目录

```
utils/api.js            接口封装
utils/color.js          口味食材色（16 色）
utils/flavor_icon.js    口味象形图标（主料优先）
utils/level.js          等级展示
assets/icons-flavor-png 口味图标 PNG（2x / 3x）
assets/tabbar            底部导航图标
```

## 视觉规范

```
底色 #FBF7EE  主色 #111 / #FFE600
边框 2.5px 黑，硬阴影 4px 4px 0
贴纸感、手绘感，不用渐变
```

## 接口

默认指向线上 API（见 `utils/api.js` 里的 BASE_URL），本地调试可改为 `http://127.0.0.1:8010`。

## 运行

用抖音开发者工具打开本目录，填入自己的 AppID 即可预览。
