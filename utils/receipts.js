const api = require('./api');

function decorateReceipt(r) {
  return Object.assign({}, r, {
    pay_text: api.money(r.pay_cents),
    date_text: api.shortDate(r.date),
    is_refund: r.sale_type === 'refund'
  });
}

module.exports = { decorateReceipt };
