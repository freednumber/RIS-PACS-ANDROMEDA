const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://localhost:3000/dicom-viewer.html?studyId=f4468dcf-1934-44b9-b755-b8f2733863ee', {waitUntil: 'networkidle0'});
  await browser.close();
})();
