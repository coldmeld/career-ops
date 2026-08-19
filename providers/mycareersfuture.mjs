// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// MyCareersFuture provider — hits the public MCF REST API (zero-token).
// All MCF jobs are Singapore-based; location is always "Singapore".
//
// portals.yml config:
//   provider: mycareersfuture
//   mcf_search: "chemical engineer process engineer"   # search terms passed to the API
//   mcf_min_salary: 4000                              # optional override (monthly SGD); default: 4000
//   mcf_category_exclude: ["building-construction"]   # optional; drop jobs whose URL contains any of these MCF category slugs
//
// API: GET https://api.mycareersfuture.gov.sg/v2/jobs?search=<terms>&limit=<n>&page=<n>&sortBy=new_posting_date&salary=<n>
// Response: { total: N, results: [{ title, metadata.jobDetailsUrl, postedCompany.name, minimumYearsOfExperience, ... }] }
// Results are sorted newest-first by posting date.
//
// Experience ceiling filter:
//   mcf_max_experience_years: 4   # optional; jobs requiring >= this many years are dropped
//                                 # Default: 4 (profile ceiling is ~3.5yr post-grad)

const MCF_API = 'https://api.mycareersfuture.gov.sg/v2/jobs';
const PAGE_SIZE = 40;
const MAX_JOBS = 80;

/** @type {Provider} */
export default {
  id: 'mycareersfuture',

  detect(_entry) {
    return null; // only used with explicit provider: mycareersfuture
  },

  async fetch(entry, ctx) {
    const search = String(entry.mcf_search || '').trim();
    if (!search) throw new Error(`mycareersfuture: mcf_search is required for "${entry.name}"`);

    const minSalary = typeof entry.mcf_min_salary === 'number' ? entry.mcf_min_salary : 4000;
    // Drop postings that explicitly require more years than the profile ceiling.
    // Conservative: missing or null field = pass through (many postings omit this field).
    const maxExpYears = typeof entry.mcf_max_experience_years === 'number'
      ? entry.mcf_max_experience_years
      : 4;

    const allJobs = [];
    let page = 0;

    while (allJobs.length < MAX_JOBS) {
      const url = `${MCF_API}?search=${encodeURIComponent(search)}&limit=${PAGE_SIZE}&page=${page}&sortBy=new_posting_date&salary=${minSalary}`;
      const json = await ctx.fetchJson(url);

      const results = Array.isArray(json?.results) ? json.results : [];
      for (const j of results) {
        const jobUrl = j?.metadata?.jobDetailsUrl;
        if (!jobUrl) continue;
        const minExp = j.minimumYearsOfExperience;
        if (typeof minExp === 'number' && minExp >= maxExpYears) continue;
        const vacancies = typeof j.numberOfVacancies === 'number' ? j.numberOfVacancies : undefined;
        allJobs.push({
          title: String(j.title || '').trim(),
          url: jobUrl,
          company: String(j?.postedCompany?.name || entry.name).trim(),
          location: 'Singapore',
          ...(vacancies !== undefined && { vacancies }),
        });
      }

      const total = typeof json?.total === 'number' ? json.total : 0;
      page++;
      if (results.length === 0 || allJobs.length >= total) break;
    }

    const excludeCategories = Array.isArray(entry.mcf_category_exclude) ? entry.mcf_category_exclude : [];
    if (excludeCategories.length === 0) return allJobs;
    return allJobs.filter(j => !excludeCategories.some(cat => j.url.includes(`/${cat}/`)));
  },
};
