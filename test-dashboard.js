import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
  });
  
  // Navigate to the page
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Wait for the dashboard to load
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if any error text is visible
  const errorText = await page.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Invariant') || body.includes('Error') || body.includes('error')) {
      return body;
    }
    return null;
  });
  
  if (errorText) {
    console.log('Error found on page:', errorText);
  } else {
    console.log('No errors found! Dashboard loaded successfully.');
  }
  
  // Check if charts are present
  const chartsLoaded = await page.evaluate(() => {
    return document.querySelector('.recharts-wrapper') !== null;
  });
  
  console.log('Charts loaded:', chartsLoaded);
  
  await browser.close();
})();