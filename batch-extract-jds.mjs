#!/usr/bin/env node
if (!process.env.PLAYWRIGHT_BROWSERS_PATH) process.env.PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const OUTPUT_DIR = '/tmp/claude-1002/-workspace-career-ops/0e8d2a9e-3d5e-4c33-93a5-f965e398d9a8/scratchpad/jds';
mkdirSync(OUTPUT_DIR, { recursive: true });

const urls = [
  { id: 'mcf-01-stmicro-ehs-env', url: 'https://www.mycareersfuture.gov.sg/job/manufacturing/senior-ehs-engineer-environmental-stmicroelectronics-debcdd95bc8986a8c628af236eae2cf1', company: 'STMICROELECTRONICS PTE LTD', role: 'Senior EHS Engineer, Environmental' },
  { id: 'mcf-02-ademco-pe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-ademco-27c399bb5f0d61045cd79d4059404bc9', company: 'ADEMCO (FAR EAST) PTE LTD', role: 'Project Engineer' },
  { id: 'mcf-03-rncare-ai-infra', url: 'https://www.mycareersfuture.gov.sg/job/information-technology/ai-infrastructure-project-engineer-rn-care-27f34c81136f7f76cc546f2a6b11746e', company: 'RN CARE PTE. LTD.', role: 'AI Infrastructure Project Engineer' },
  { id: 'mcf-04-rncare-ai-dc', url: 'https://www.mycareersfuture.gov.sg/job/information-technology/ai-data-centre-project-engineer-rn-care-7ec3169c74237b983c1783a96a1dde8f', company: 'RN CARE PTE. LTD.', role: 'AI Data Centre Project Engineer' },
  { id: 'mcf-05-jte-pe', url: 'https://www.mycareersfuture.gov.sg/job/architecture/project-engineer-jte-recruit-2e094d0c38679339556b2cf71502722d', company: 'JTE RECRUIT PTE. LTD.', role: 'Project Engineer' },
  { id: 'mcf-06-jobexpress-pe-4k', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-job-express-services-ca6e61d5547786897fb1e3785bb71aff', company: 'JOB EXPRESS SERVICES PTE. LTD.', role: 'Project Engineer (Up to $4000)' },
  { id: 'mcf-07-oconnors-pe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-oconnors-singapore-fb30fb631f2b5dcd8026a1ea574643d5', company: "O'CONNOR'S SINGAPORE PTE LTD", role: 'Project Engineer' },
  { id: 'mcf-08-recruitfast-spe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/senior-project-engineer-recruit-fast-848c7cf507eba26d935bb0d7793b225a', company: 'RECRUIT FAST PTE. LTD.', role: 'Senior Project Engineer (Data Centre)' },
  { id: 'mcf-09-cw-sheetmetal', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-%E2%80%93-sheet-metal-workshop-c-w-electronics-5659af8bd5c34ab8eda3b6a596e21c6e', company: 'C & W ELECTRONICS PTE LTD', role: 'Project Engineer Sheet Metal Workshop' },
  { id: 'mcf-10-jobexpress-pe-45k', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-job-express-services-2abc9240227a96f7e738b642ef21383b', company: 'JOB EXPRESS SERVICES PTE. LTD.', role: 'Project Engineer (Up to $4500)' },
  { id: 'mcf-11-ademco-spe-security', url: 'https://www.mycareersfuture.gov.sg/job/engineering/senior-project-engineer-ademco-b876f2624a0d694aef6b64fa25912782', company: 'ADEMCO (FAR EAST) PTE LTD', role: 'Senior Project Engineer (Security Systems)' },
  { id: 'mcf-12-rncare-pe-security', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-rn-care-b87e031f8b6bef045dac573a24708afb', company: 'RN CARE PTE. LTD.', role: 'Project Engineer (Security Systems)' },
  { id: 'mcf-13-ea-pe-plcscada', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-ea-recruitment-7743a319de69bd5b5ba2f0474c2d2e60', company: 'EA RECRUITMENT PTE. LTD.', role: 'Project Engineer (PLC/SCADA)' },
  { id: 'mcf-14-rncare-pe-plcscada', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-rn-care-41b870f417f3050b647e101341303845', company: 'RN CARE PTE. LTD.', role: 'Project Engineer (PLC/SCADA)' },
  { id: 'mcf-15-rncare-pe-metalcasting', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-rn-care-96b5ffb3a141419b53d49e54487be51e', company: 'RN CARE PTE. LTD.', role: 'Project Engineer (Metal Casting)' },
  { id: 'mcf-16-rncare-cctv', url: 'https://www.mycareersfuture.gov.sg/job/engineering/cctv-project-engineer-rn-care-abf8f879e34b954118de3221f3285d1e', company: 'RN CARE PTE. LTD.', role: 'CCTV Project Engineer' },
  { id: 'mcf-17-steng-amel-pe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/project-engineer-st-engineering-advanced-material-engineering-280b943108446d50730e24bc4f298d1c', company: 'ST ENGINEERING ADVANCED MATERIAL ENGINEERING PTE. LTD.', role: 'Project Engineer' },
  { id: 'mcf-18-nus-re', url: 'https://www.mycareersfuture.gov.sg/job/engineering/research-engineer-national-university-singapore-f9771024f4a45388d2324f166b1f7d48', company: 'NATIONAL UNIVERSITY OF SINGAPORE', role: 'Research Engineer (Chemical Engineering & Project Management)' },
  { id: 'mcf-19-solar-pe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/solar-project-engineer-search-personnel-21e135ac33eaed7518eb1dc43a63e513', company: 'SEARCH PERSONNEL PRIVATE LIMITED', role: 'Solar Project Engineer' },
  { id: 'mcf-20-wahson-qe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/quality-engineer-wah-son-engineering-43ed89d951b23868a1a843bba7abef9f', company: 'WAH SON ENGINEERING PTE. LTD.', role: 'Quality Engineer' },
  { id: 'mcf-21-rncare-qe-semicon', url: 'https://www.mycareersfuture.gov.sg/job/engineering/quality-engineer-rn-care-de2ee955d2aa3343cd7b97286756c82a', company: 'RN CARE PTE. LTD.', role: 'Quality Engineer (Manufacturing / Semiconductor)' },
  { id: 'mcf-22-rncare-qe-aero', url: 'https://www.mycareersfuture.gov.sg/job/engineering/quality-engineer-rn-care-caf392d9058cba2a51800a7770833be1', company: 'RN CARE PTE. LTD.', role: 'Quality Engineer (Aerospace)' },
  { id: 'mcf-23-rncare-sqe-aero', url: 'https://www.mycareersfuture.gov.sg/job/engineering/senior-quality-engineer-rn-care-99108673b98d3eac227cfb245f5bf794', company: 'RN CARE PTE. LTD.', role: 'Senior Quality Engineer (Aerospace)' },
  { id: 'mcf-24-rncare-sqe-oilgas', url: 'https://www.mycareersfuture.gov.sg/job/engineering/supplier-quality-engineer-rn-care-f0607e66740f5904678d6c5cad1a0f4c', company: 'RN CARE PTE. LTD.', role: 'Supplier Quality Engineer (Oil&Gas)' },
  { id: 'mcf-25-trustrecruit-cqe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/customer-quality-engineer-trust-recruit-050adc58261428d20755c92b500197c0', company: 'TRUST RECRUIT PTE. LTD.', role: 'Customer Quality Engineer (West/Manufacturing)' },
  { id: 'mcf-26-stmicro-ehs-hs', url: 'https://www.mycareersfuture.gov.sg/job/environment/senior-ehs-engineer-health-safety-stmicroelectronics-1bc7cfe2e965a3fa4a68ba450f2a893b', company: 'STMICROELECTRONICS PTE LTD', role: 'Senior EHS Engineer, Health and Safety' },
  { id: 'mcf-27-micron-ie', url: 'https://www.mycareersfuture.gov.sg/job/engineering/industrial-engineer-micron-semiconductor-asia-operations-db3bd772a2e072c02b579f719dd8e64f', company: 'MICRON SEMICONDUCTOR ASIA OPERATIONS PTE. LTD.', role: 'Industrial Engineer' },
  { id: 'mcf-28-screenspe-pe', url: 'https://www.mycareersfuture.gov.sg/job/engineering/process-engineer-screen-spe-singapore-35165c70503b939df370240880315264', company: 'SCREEN SPE SINGAPORE PTE. LTD.', role: 'Process Engineer' },
  { id: 'mcf-29-ssmc-furnace', url: 'https://www.mycareersfuture.gov.sg/job/engineering/furnace-process-engineer-systems-silicon-manufacturing-company-b24b37d9fed7eb2e434360c56831fac7', company: 'SYSTEMS ON SILICON MANUFACTURING COMPANY PTE LTD', role: 'Furnace Process Engineer' },
  { id: 'mcf-30-netlink-ae', url: 'https://www.mycareersfuture.gov.sg/job/information-technology/associate-engineer-netlink-trust-operations-company-3790a2c47ba41ea83eae9fd2f9e34b6e', company: 'NETLINK TRUST OPERATIONS COMPANY PTE. LTD.', role: 'Associate Engineer' },
  { id: 'mcf-31-aurigin-me', url: 'https://www.mycareersfuture.gov.sg/job/manufacturing/manufacturing-engineer-aurigin-technology-791e03872842a5ef3da2232ea9bace4d', company: 'AURIGIN TECHNOLOGY PTE LTD', role: 'Manufacturing Engineer' },
  { id: 'mcf-32-oms-srde', url: 'https://www.mycareersfuture.gov.sg/job/engineering/senior-rd-engineer-oms-oilfield-services-e6cddf4f740d1711a36360f955cd4d90', company: 'OMS OILFIELD SERVICES PTE. LTD.', role: 'Senior R&D Engineer' },
  { id: 'gov-33-mpa-chemist', url: 'https://jobs.careers.gov.sg/jobs/hrp/15863941/f7a787d0-e6d8-1fe0-9bb0-598ae3d24252', company: 'Maritime and Port Authority of Singapore', role: 'Port Chemist (2-years contract)' },
  { id: 'gov-34-cyber-analyst', url: 'https://jobs.careers.gov.sg/jobs/hrp/15316227/005056a3-d347-1fe1-99a1-39fae12b02a8', company: 'Careers@Gov', role: 'Senior / Specialist (Cyber Analysis & Operations)' },
  { id: 'js-35-cvista-rnd', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEPyRlMRo_6NXrxwJQMmvUnvup4XnFuSa7vX9nrUV0KF1_tpqmx-50DJzWuXXkU5q5jV2zjBb5naHFLeNC-OQseJ9hyBiopMTgw-RBR7E8KkZtO8YVo1SqQtQ6xB-DE2hiQ/4ru/0D4gXvF3TR-E1BzopZNFQg/h49/h001.0qqEDrR-fOzPB1OX2tpKYi-8_-KQGE3xS1TVEKFZ5fc', company: 'CVista HR Consulting Pte Ltd', role: 'R&D Specialist (Chemical waste)' },
  { id: 'js-36-talentvis-mpe', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEPymOu_aWSZxmKwkbGo0n9qFD5MrWLu0i1nYML7D8tIuIbghZH-KKuvgHhuSHQUdNqp2d3IRohZZpR3Mub9XzOiEg1NHGb9w6n9PbgxMgJoeht3liqCYyn88V3eDYzVmuQ/4ru/0D4gXvF3TR-E1BzopZNFQg/h51/h001.csyZg68b0uIZVul6uXvduMM7MhkvtEGWnh4T68FlS5g', company: 'Talentvis Singapore Pte Ltd', role: 'Manufacturing Process Engineer [EMS]' },
  { id: 'js-37-wanco-fab', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKENeYLv3jNSYOlDAN5QSTUX6xU3FjfhRWZsrAl3tTYp9UQSPtHjIZZcvea-7_E4cohBU3-yTHYZ58wpEDW0nw2brxelQCvsxe-jDc3RgPpfo5WFaCekk3tHB9F_oSraezbc/4ru/0D4gXvF3TR-E1BzopZNFQg/h53/h001.2WKuEDUuBcCoevHK7MS7sPNN9TPH8xutJKSNKf2sj8U', company: 'Wanco Manpower Pte Ltd', role: 'Fab Engineer (Equipment/Process) Semiconductor' },
  { id: 'js-38-tempserv-unknown', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEMC-KOAhIrRCTxeWyHRdoDuM-TzBZFVuefXbTDWIOouylujaaGIslO3ulzjUaQqGlDBgRnxvObuCQzPmEyB527AkAAT6L3xmjbiRnyKsx_aUyno2PHhChDtzxqA1-wZ9uw/4ru/0D4gXvF3TR-E1BzopZNFQg/h55/h001.VQchsEYN3PB5cdEpjHhg-IH33kA0K4IYyR2LnnzdQ44', company: 'TempServ Pte Ltd', role: 'verify role' },
  { id: 'js-39-alpsoft-me', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEMkw3bFLmYjAIjv1krk9ZFj9iMJKV8pHwTM60j0T0P7MWaFfAtliRDjeAZe3qZf6cZg7yUA-2BtL93oqsJkw1fQ0BDJ7mFAhnL1kuk4026eY-7S7ITM6mwTY4iHZ8H0UE4/4ru/0D4gXvF3TR-E1BzopZNFQg/h57/h001.ZmmXVZ-c6cfnNbBvSEwTgHZcJdzt74k_zR4bARmqbCk', company: 'AlpSoft Technologies Pte Ltd', role: 'Manufacturing Engineer / CI / Process' },
  { id: 'js-40-mtc-qe-semicon', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEMKyLbsiwnOTbHEE2vx-0AWRGBS61KB5MH2As8ReT9LSgfxQ8o6E1E27fjo9O27Ey__7mX6KPYePdaCIgZACB-5QSJnGRfHYbckTrOGBq7d_wBzvRjMljIyZjtbhDj_BE8/4ru/0D4gXvF3TR-E1BzopZNFQg/h61/h001.8svaYK0iB7dHMxOvaM2onygWGTV6bH6PojxSJxJy_Fo', company: 'MTC Consulting Pte. Ltd.', role: 'Quality Engineer (Semiconductor/West)' },
  { id: 'js-41-robox-sqe', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKEMQpH7IBAPXzVGsWuSVnhiPo6yKvmmkbQaY95nB0I5i0ymD8wmkS0uthLMcGCtJdug6v2JnNtx_cmgY8gIMYu1AKbhiiMC8A6NnbSHUGIElQhPiA78cLip2y618U6I5RzA/4ru/0D4gXvF3TR-E1BzopZNFQg/h63/h001.4wjMzOgJkUqclYkl4XYVm9S61-34yNI3sVhh0J2_hXk', company: 'ROBOX SG PTE.LTD.', role: 'Supplier Quality Engineer (SQE)' },
  { id: 'js-44-mmc-rnd', url: 'https://url.jobstreet.com/uni/ss/c/u001.3Q7llEJ8xPfGy0bi906eaYQDIACt-6praJxdhtNyKENIHxcUbIWxTLjyKGFHAYhCKsV2j8fKydLhXz_-Huuf5cjPgdpFl4MBvSELEUb3QpCW4e8noaxVzjl9x_r7fDnI-rjf_0YYTZznWKezDSrc-7sRbbhj2rctibzavwdo2P4/4ru/0D4gXvF3TR-E1BzopZNFQg/h73/h001.oLcvrxBjSJrHwJ91c4Y50jqcVdLEFScrhWBPMQa05ao', company: 'MMC Success Pte. Ltd.', role: 'R&D Specialist (Chemical Process / 5D)' },
];

async function extractJD(page, url, id) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    const title = await page.title();
    const content = await page.evaluate(() => {
      const remove = document.querySelectorAll('script, style, nav, footer');
      remove.forEach(el => el.remove());
      return document.body ? document.body.innerText : '';
    });
    return { id, url, finalUrl, title, content: content.substring(0, 10000), error: null };
  } catch (err) {
    return { id, url, finalUrl: url, title: '', content: '', error: err.message };
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ userAgent: UA });
  const page = await context.newPage();

  for (const { id, url, company, role } of urls) {
    const outFile = join(OUTPUT_DIR, `${id}.json`);
    if (existsSync(outFile)) {
      console.log(`SKIP (cached) ${id}`);
      continue;
    }
    console.log(`Extracting: ${id} — ${company} | ${role}`);
    const result = await extractJD(page, url, id);
    result.company = company;
    result.role = role;
    writeFileSync(outFile, JSON.stringify(result, null, 2));
    console.log(`  Saved: ${outFile.split('/').pop()} (${result.content.length} chars, error: ${result.error || 'none'})`);
    await page.waitForTimeout(1500);
  }

  await browser.close();
  console.log('\nAll JDs extracted!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
