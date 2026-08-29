const isFirefox = false;
const browserAPI = chrome;

if (typeof self !== 'undefined') {
  self.isFirefox = isFirefox;
  self.browserAPI = browserAPI;
}

if (typeof exports !== 'undefined') {
  exports.isFirefox = isFirefox;
  exports.browserAPI = browserAPI;
}