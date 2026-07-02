#!/usr/bin/env node
/**
 * extract-jd-temp.mjs — Extract job description from a URL using Playwright
 * Usage: PLAYWRIGHT_BROWSERS_PATH=/ms-playwright node extract-jd-temp.mjs <url>
 */

if (!process.env.PLAYWRIGHT_BROWSERS_PATH) process.env.PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('Usage: node extract-jd-temp.mjs <url>');
  process.exit(1);
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Get page title
    const title = await page.title();
    console.log(`PAGE_TITLE: ${title}`);
    console.log(`PAGE_URL: ${page.url()}`);
    console.log('---PAGE_CONTENT_START---');

    // Try to get the full text content
    const content = await page.evaluate(() => {
      // Remove scripts, styles, nav, footer
      const remove = document.querySelectorAll('script, style, nav, footer, header');
      remove.forEach(el => el.remove());
      return document.body ? document.body.innerText : document.documentElement.innerText;
    });

    console.log(content.substring(0, 8000));
    console.log('---PAGE_CONTENT_END---');
  } catch (err) {
    console.error(`Error navigating to ${url}: ${err.message}`);
    // Try to get whatever content is available
    try {
      const content = await page.evaluate(() => document.body ? document.body.innerText : '');
      console.log('---PARTIAL_CONTENT---');
      console.log(content.substring(0, 4000));
    } catch(e2) {
      console.error('Could not extract partial content:', e2.message);
    }
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
