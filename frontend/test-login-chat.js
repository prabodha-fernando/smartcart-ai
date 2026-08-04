const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('TAB 1 LOG:', msg.text()));

    console.log("Navigating to login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

    // Click Guest Login
    console.log("Clicking Guest Login...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const guestBtn = buttons.find(b => b.textContent.includes('Continue as Guest'));
      if (guestBtn) guestBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Logged in. URL is now:", page.url());

    // Wait a sec for chat history to load
    await new Promise(r => setTimeout(r, 2000));

    // Get chat messages in Tab 1
    const messagesTab1 = await page.evaluate(() => {
      // Find all message texts
      return Array.from(document.querySelectorAll('.flex-1.overflow-y-auto p')).map(p => p.textContent);
    });
    console.log("Messages in Tab 1:", messagesTab1);

    // Now open a new tab
    const page2 = await browser.newPage();
    page2.on('console', msg => console.log('TAB 2 LOG:', msg.text()));
    console.log("Opening new tab to localhost:3000...");
    await page2.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    await new Promise(r => setTimeout(r, 2000));

    // Get chat messages in Tab 2
    const messagesTab2 = await page2.evaluate(() => {
      return Array.from(document.querySelectorAll('.flex-1.overflow-y-auto p')).map(p => p.textContent);
    });
    console.log("Messages in Tab 2:", messagesTab2);
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
