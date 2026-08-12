import fs from 'node:fs';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('assets/resources.js', 'utf8'), sandbox);

const resources = sandbox.window.MBRN_RESOURCES || [];
const attempts = 2;
const concurrency = 8;
const timeoutMs = 25000;

async function probe(resource) {
  let lastError = '';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(resource.url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 Molecular-Biology-Navigator-Link-Check/1.0',
          Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
        }
      });
      clearTimeout(timer);
      await response.body?.cancel();
      const reachable = response.status < 400 || [401, 403, 405, 429].includes(response.status);
      return {
        id: resource.id,
        name: resource.name,
        url: resource.url,
        finalUrl: response.url,
        status: response.status,
        reachable,
        note: reachable && response.status >= 400 ? 'Server reachable but restricts automated access' : ''
      };
    } catch (error) {
      clearTimeout(timer);
      lastError = error?.name === 'AbortError' ? `Timeout after ${timeoutMs / 1000}s` : String(error?.cause?.code || error?.message || error);
    }
  }
  return { id: resource.id, name: resource.name, url: resource.url, finalUrl: '', status: 0, reachable: false, note: lastError };
}

const results = new Array(resources.length);
let cursor = 0;
async function worker() {
  while (cursor < resources.length) {
    const index = cursor;
    cursor += 1;
    results[index] = await probe(resources[index]);
    const result = results[index];
    console.log(`${result.reachable ? 'PASS' : 'FAIL'}\t${result.status || '-'}\t${result.name}\t${result.url}${result.note ? `\t${result.note}` : ''}`);
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));

const failed = results.filter((result) => !result.reachable);
const restricted = results.filter((result) => result.reachable && result.status >= 400);
const report = [
  '# Resource link check',
  '',
  `Checked: ${results.length}`,
  `Reachable: ${results.length - failed.length}`,
  `Restricted to automated requests: ${restricted.length}`,
  `Needs review: ${failed.length}`,
  '',
  '## Needs review',
  '',
  ...(failed.length ? failed.map((result) => `- ${result.name}: ${result.url} — ${result.note || result.status}`) : ['- None']),
  '',
  '## Automated-access restrictions',
  '',
  ...(restricted.length ? restricted.map((result) => `- ${result.name}: HTTP ${result.status}`) : ['- None']),
  ''
].join('\n');

fs.writeFileSync('link-check-report.md', report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
if (failed.length) process.exitCode = 1;
