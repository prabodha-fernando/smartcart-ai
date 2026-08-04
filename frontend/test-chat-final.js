const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    page.on('console', msg => console.log('TAB 1 LOG:', msg.text()));

    console.log("Navigating to login...");
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });

    console.log("Clicking Guest Login...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const guestBtn = buttons.find(b => b.textContent.includes('Continue as Guest'));
      if (guestBtn) guestBtn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log("Logged in Tab 1.");

    // Open Floating AI Assistant
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-controls="floating-ai-assistant"]');
      if (btn) btn.click();
    });
    
    await new Promise(r => setTimeout(r, 1000));
    
    // Type and send message
    await page.type('#floating-ai-assistant input', 'Hello AI!');
    await page.evaluate(() => {
      const form = document.querySelector('#floating-ai-assistant form');
      if (form) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.click();
      }
    });

    console.log("Sent message. Waiting 3s for reply...");
    await new Promise(r => setTimeout(r, 3000));

    const messagesTab1 = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#floating-ai-assistant .whitespace-pre-wrap')).map(p => p.textContent);
    });
    console.log("Messages in Tab 1:", messagesTab1);

    // Now click New chat
    console.log("Clicking New chat...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#floating-ai-assistant button'));
      const newChatBtn = buttons.find(b => b.textContent.includes('New chat'));
      if (newChatBtn) newChatBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    const messagesTab1AfterReset = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('#floating-ai-assistant .whitespace-pre-wrap')).map(p => p.textContent);
    });
    console.log("Messages in Tab 1 after New Chat:", messagesTab1AfterReset);

    // Now open a new tab
    const page2 = await browser.newPage();
    page2.on('console', msg => console.log('TAB 2 LOG:', msg.text()));
    console.log("Opening new tab to localhost:3000...");
    await page2.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    // Open Floating AI Assistant in Tab 2
    await page2.evaluate(() => {
      const btn = document.querySelector('button[aria-controls="floating-ai-assistant"]');
      if (btn) btn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    const messagesTab2 = await page2.evaluate(() => {
      return Array.from(document.querySelectorAll('#floating-ai-assistant .whitespace-pre-wrap')).map(p => p.textContent);
    });
    console.log("Messages in Tab 2:", messagesTab2);
    
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
