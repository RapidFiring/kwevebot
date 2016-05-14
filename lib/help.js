'use strict';

class Help {
  static allHelp() {
    return [
      require('./central').globalHelp()
    ];
  }
}

module.exports = Help;
