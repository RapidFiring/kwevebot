'use strict';

class Help {
  static allHelp() {
    return [
      require('./central').globalHelp(),
      require('./industry').globalHelp()
    ];
  }
}

module.exports = Help;
