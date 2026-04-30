const puppeteer = require('puppeteer');
(async () => {
    try {
        console.log("Starting browser...");
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('BROWSER_LOG:', msg.type(), msg.text()));
        page.on('pageerror', err => console.log('BROWSER_PAGE_ERROR:', err.toString()));
        
        console.log("Navigating to viewer...");
        await page.goto('http://localhost:3000/dicom-viewer-v4.html?studyId=f4468dcf-1934-44b9-b755-b8f2733863ee', { waitUntil: 'networkidle0', timeout: 30000 });
        
        await new Promise(r => setTimeout(r, 5000));
        await browser.close();
        console.log("Done.");
    } catch (e) {
        console.error("Puppeteer error:", e);
    }
})();
