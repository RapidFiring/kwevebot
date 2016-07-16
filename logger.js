'use strict';

const winston = require('winston');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');

winston.emitErrs = true;

const logDir = __dirname + '/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

//add custom logging levels
let levels = _.clone(winston.config.syslog.levels);
let colors = _.clone(winston.config.syslog.colors);

levels.request = _.max(levels) + 1;
colors.request = 'blue';

const logger = new winston.Logger({
  levels: levels,
  colors: colors,
  exceptionHandlers: [
    new winston.transports.File({filename:  logDir + '/exceptions.log'})
  ],
  transports: [
    new winston.transports.File({
      name: 'info-file',
      level: 'debug',
      filename:  logDir + '/all-logs.log',
      json: false,
      maxsize: 52428800, //50MB
      maxFiles: 15,
      colorize: false,
      timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      },
      formatter: (options) => {
        return '[' + options.timestamp() +'] level='+ options.level.toUpperCase() +
          ' msg='+ (undefined !== options.message ? JSON.stringify(options.message) : '') +
          (options.meta && Object.keys(options.meta).length ? ' meta='+ JSON.stringify(options.meta) : '' );
      },
    }),
    new winston.transports.File({
      name: 'error-file',
      level: 'error',
      filename:  logDir + '/error-logs.log',
      json: false,
      maxsize: 52428800, //50MB
      maxFiles: 15,
      colorize: false,
      timestamp: () => {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
      },
      formatter: (options) => {
        return '[' + options.timestamp() +'] level='+ options.level.toUpperCase() +
          ' msg='+ (undefined !== options.message ? JSON.stringify(options.message) : '') +
          (options.meta && Object.keys(options.meta).length ? ' meta='+ JSON.stringify(options.meta) : '' );
      },
    }),
    new winston.transports.File({
      name: 'request-file',
      level: 'request',
      filename:  logDir + '/requests.log',
      json: true,
      maxsize: 52428800, //50MB
      maxFiles: 15,
      colorize: false
    })
  ],
  exitOnError: false
});

module.exports = logger;
