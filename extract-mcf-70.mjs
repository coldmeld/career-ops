import { chromium } from 'playwright';

const url = 'https://www.mycareersfuture.gov.sg/job/engineering/quality-engineer-atomrecruit-3f12b5b2bc1a21fd8db64004bb848ba3';

const browser = await chromium.launch({
  executablePath: '/ms-playwright/chromium-1228/chrome-linux64/chrome',
  headless: true,
});

const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
});

const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);

const content = await page.evaluate(() => document.body.innerText);
console.log(content);

await browser.close();
