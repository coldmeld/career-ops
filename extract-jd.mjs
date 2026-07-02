import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) { console.error('Usage: node extract-jd.mjs <url>'); process.exit(1); }

const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/ms-playwright/chromium-1228/chrome-linux64/chrome',
    headless: true,
  });
  const page = await browser.newPage({ userAgent });

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const jdContent = await page.evaluate(() => document.body.innerText);
    console.log(jdContent);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
