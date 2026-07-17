import { chromium } from 'playwright';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const urls = [
  { id: 1, url: 'https://msd.wd5.myworkdayjobs.com/SearchJobs/job/SGP---Singapore---Singapore-70-Tuas-West-Dr/Utilities-Facilities-Management-Intern_R396558', label: 'MSD Utilities Intern' },
  { id: 2, url: 'https://sg.jobstreet.com/job/92976180', label: 'Anradus Quality Engineer' },
  { id: 3, url: 'https://sg.jobstreet.com/job/93063569', label: 'Align NPI Laser' },
  { id: 4, url: 'https://sg.jobstreet.com/job/93063997', label: 'ST Engineering Quality' },
  { id: 5, url: 'https://sg.jobstreet.com/job/93078078', label: 'AEM Vendor Quality' },
  { id: 6, url: 'https://sg.jobstreet.com/job/93034137', label: 'Banshing Manufacturing' },
  { id: 7, url: 'https://sg.jobstreet.com/job/92998491', label: 'Genic Process Engineer' },
  { id: 8, url: 'https://sg.indeed.com/viewjob?jk=7b6df11f4e6185', label: 'Berkeley Forward Deploy' },
  { id: 9, url: 'https://sg.indeed.com/viewjob?jk=fe9b3b76b881ff', label: 'Merck GOglobal Data AI' },
  { id: 10, url: 'https://sg.indeed.com/viewjob?jk=ea393692a91ebc', label: 'GSK Sustainability Intern' },
  { id: 11, url: 'https://sg.indeed.com/viewjob?jk=1e3ae6ac805b89', label: 'GSK EHS Intern' },
  { id: 12, url: 'https://sg.indeed.com/viewjob?jk=4f1fb52add708d', label: 'Nova Application Specialist' },
  { id: 13, url: 'https://sg.indeed.com/viewjob?jk=d853ae0907a242', label: 'Fuku Operations Engineer' },
  { id: 14, url: 'https://sg.indeed.com/viewjob?jk=d853ae0907a242', label: 'Nusantara Junior Validation' }, // fallback - using Fuku url as placeholder; actual URL is cts.indeed.com
];

// For Nusantara, try the cts.indeed.com redirect differently
const nusantaraUrl = 'https://sg.indeed.com/rc/clk?jk=d853ae0907a242'; // will try direct

async function fetchPage(browser, id, url, label) {
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();
  try {
    console.log(`[${id}] Fetching: ${label}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const text = await page.evaluate(() => document.body.innerText);
    const title = await page.title();
    const finalUrl = page.url();
    await context.close();
    return { id, label, url, finalUrl, title, text: text.substring(0, 8000) };
  } catch (e) {
    await context.close();
    return { id, label, url, error: e.message };
  }
}

const browser = await chromium.launch({
  executablePath: '/ms-playwright/chromium-1228/chrome-linux64/chrome',
  headless: true
});

// Process sequentially to avoid rate limiting
const results = [];
for (const item of [
  { id: 1, url: 'https://msd.wd5.myworkdayjobs.com/SearchJobs/job/SGP---Singapore---Singapore-70-Tuas-West-Dr/Utilities-Facilities-Management-Intern_R396558', label: 'MSD Utilities Intern' },
  { id: 2, url: 'https://sg.jobstreet.com/job/92976180', label: 'Anradus Quality Engineer' },
  { id: 3, url: 'https://sg.jobstreet.com/job/93063569', label: 'Align NPI Laser' },
  { id: 4, url: 'https://sg.jobstreet.com/job/93063997', label: 'ST Engineering Quality' },
  { id: 5, url: 'https://sg.jobstreet.com/job/93078078', label: 'AEM Vendor Quality' },
  { id: 6, url: 'https://sg.jobstreet.com/job/93034137', label: 'Banshing Manufacturing' },
  { id: 7, url: 'https://sg.jobstreet.com/job/92998491', label: 'Genic Process Engineer' },
  { id: 8, url: 'https://sg.indeed.com/viewjob?jk=7b6df11f4e6185', label: 'Berkeley Forward Deploy' },
  { id: 9, url: 'https://sg.indeed.com/viewjob?jk=fe9b3b76b881ff', label: 'Merck GOglobal Data AI' },
  { id: 10, url: 'https://sg.indeed.com/viewjob?jk=ea393692a91ebc', label: 'GSK Sustainability Intern' },
  { id: 11, url: 'https://sg.indeed.com/viewjob?jk=1e3ae6ac805b89', label: 'GSK EHS Intern' },
  { id: 12, url: 'https://sg.indeed.com/viewjob?jk=4f1fb52add708d', label: 'Nova Application Specialist' },
  { id: 13, url: 'https://sg.indeed.com/viewjob?jk=d853ae0907a242', label: 'Fuku Operations Engineer' },
]) {
  const r = await fetchPage(browser, item.id, item.url, item.label);
  results.push(r);
}

// Try Nusantara separately via indeed search
const r14 = await fetchPage(browser, 14, 'https://sg.indeed.com/viewjob?jk=5f48e80e3f7f4ab6', 'Nusantara Junior Validation');
results.push(r14);

await browser.close();

// Output all results
for (const r of results) {
  console.log('\n' + '='.repeat(80));
  console.log(`ID: ${r.id} | ${r.label}`);
  console.log(`URL: ${r.url}`);
  if (r.error) {
    console.log(`ERROR: ${r.error}`);
  } else {
    console.log(`Final URL: ${r.finalUrl}`);
    console.log(`Title: ${r.title}`);
    console.log('--- TEXT ---');
    console.log(r.text);
  }
}
