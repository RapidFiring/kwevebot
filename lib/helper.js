'use strict';

String.prototype.capitalize = function(){
  return this.toLowerCase().replace( /\b\w/g, (m) => {
    return m.toUpperCase();
  });
};

Number.prototype.formatISK = function(n, x, s, c) {
  var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
    num = this.toFixed(Math.max(0, ~~n));

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
};

Date.prototype.SubtractMonth = function (numberOfMonths) {
  var d = this;
  d.setMonth(d.getMonth() - numberOfMonths);
  d.setDate(1);
  return d;
};

module.exports.formatUptime = function (uptime) {
  let unit = 'second';
  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'minute';
  }

  if (uptime > 60) {
    uptime = uptime / 60;
    unit = 'hour';
  }

  if (uptime !== 1) {
    unit = unit + 's';
  }

  return uptime.toFixed(2) + ' ' + unit;
};

module.exports.paddingRight = function (s, c, n) {
  if (!s || !c || s.length >= n) {
    return s;
  }
  var max = (n - s.length) / c.length;
  for (var i = 0; i < max; i++) {
    s += c;
  }
  return s;
};
