const {Builder, ITimeouts} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

let driver;

const args = [
  '--ignore-certificate-errors',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-accelerated-2d-canvas',
  '--disable-gpu',
];

module.exports = class SeleniumDriver {
  constructor() {
    if (driver) { return driver; }
  }

  async init(url) {
    driver = await new Builder().forBrowser('chrome')
      .setChromeOptions(new chrome.Options().addArguments(args).headless()).build();
    await driver.get(process.env.URL);
    return driver;
  }
};
