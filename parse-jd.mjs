import fs from 'fs';

const html = fs.readFileSync('/tmp/jd-raw.html', 'utf-8');

// Extract job details using regex patterns
const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
const structuredMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([^<]+)<\/script>/);

let output = '';

if (titleMatch) output += `TITLE: ${titleMatch[1]}\n\n`;

// Try to extract structured content
if (structuredMatch) {
  try {
    const jsonData = JSON.parse(structuredMatch[1]);
    if (jsonData.description) output += `DESCRIPTION:\n${jsonData.description}\n\n`;
    if (jsonData.employmentType) output += `TYPE: ${jsonData.employmentType}\n`;
    if (jsonData.hiringOrganization?.name) output += `COMPANY: ${jsonData.hiringOrganization.name}\n`;
    if (jsonData.jobLocation?.address?.addressLocality) output += `LOCATION: ${jsonData.jobLocation.address.addressLocality}\n`;
    if (jsonData.baseSalary) {
      output += `SALARY: ${jsonData.baseSalary.currency} ${jsonData.baseSalary.value?.minValue || ''}-${jsonData.baseSalary.value?.maxValue || ''}\n`;
    }
  } catch(e) {}
}

// Fallback: extract visible text from main content areas
const mainContent = html.match(/<main[^>]*>[\s\S]*?<\/main>/i);
if (mainContent) {
  let text = mainContent[0]
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n+/g, '\n')
    .trim();

  // Clean up whitespace and extract meaningful sections
  const lines = text.split('\n').filter(line => line.trim().length > 0 && line.trim().length < 500);
  output += `\nEXTRACTED CONTENT:\n${lines.slice(0, 100).join('\n')}\n`;
}

console.log(output);
