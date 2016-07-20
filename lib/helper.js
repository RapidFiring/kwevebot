'use strict';

const moment = require('moment');

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

module.exports.getTimePeriod = function (period) {
  switch (period) {
    case 'last2Weeks':
      const last2WeekStart = moment().subtract(2, 'week').isoWeekday(1).startOf('week');
      const last2WeekEnd = moment().subtract(1, 'week').isoWeekday(1).endOf('week');
      return {
        start: last2WeekStart.format('X'),
        end: last2WeekEnd.format('X'),
        startHuman: last2WeekStart.format('YYYY-MM-DD'),
        endHuman: last2WeekEnd.format('YYYY-MM-DD'),
        startYearMonth: parseInt(last2WeekStart.format('YYYYMM'), 10),
        endYearMonth: parseInt(last2WeekEnd.format('YYYYMM'), 10),
      };
      break;
    case 'lastWeek':
      const lastWeekStart = moment().subtract(1, 'week').isoWeekday(1).startOf('week');
      const lastWeekEnd = moment().subtract(1, 'week').isoWeekday(1).endOf('week');
      return {
        start: lastWeekStart.format('X'),
        end: lastWeekEnd.format('X'),
        startHuman: lastWeekStart.format('YYYY-MM-DD'),
        endHuman: lastWeekEnd.format('YYYY-MM-DD'),
        startYearMonth: parseInt(lastWeekStart.format('YYYYMM'), 10),
        endYearMonth: parseInt(lastWeekEnd.format('YYYYMM'), 10),
      };
      break;
    default:
      const now = moment().subtract(1, 'month');
      return {
        start: now.startOf('month').format('X'),
        end: now.endOf('month').format('X'),
        startHuman: now.startOf('month').format('YYYY-MM-DD'),
        endHuman: now.endOf('month').format('YYYY-MM-DD'),
        startYearMonth: parseInt(now.startOf('month').format('YYYYMM'), 10),
        endYearMonth: parseInt(now.endOf('month').format('YYYYMM'), 10),
      };
  }
};
