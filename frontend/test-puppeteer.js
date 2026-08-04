const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Listen to console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  // Load the page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Check the state of the store
  const chatMessages = await page.evaluate(() => {
    // You might not be able to easily get zustand store unless it's on window
    // We can just dump localStorage
    return window.localStorage.getItem('smartcart-auth');
  });
  console.log("Auth state:", chatMessages ? "Found" : "Not Found");
  
  await browser.close();
})();
