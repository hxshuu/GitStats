#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const LANE_COLORS = ['\x1b[34m', '\x1b[32m', '\x1b[33m', '\x1b[35m', '\x1b[36m', '\x1b[31m', '\x1b[91m'];

function color(code, text) {
  return `${COLORS[code] || ''}${text}${COLORS.reset}`;
}

function fetch(url, token, retries = 2) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const headers = { 'User-Agent': 'GitStats-CLI/1.0', 'Accept': 'application/vnd.github.v3+', 'Cache-Control': 'no-cache' };
    if (token) headers['Authorization'] = `token ${token}`;
    
    const opts = { hostname: u.hostname, path: u.pathname + u.search, method: 'GET', headers };
    const protocol = u.protocol === 'https:' ? https : http;
    
    const doReq = () => {
      const req = protocol.request(opts, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) resolve(JSON.parse(data));
          else if (res.statusCode === 403) reject(new Error('Rate limited'));
          else if (res.statusCode === 404) reject(new Error('Not found'));
          else if (res.statusCode >= 500 && retries > 0) { retries--; setTimeout(doReq, 1000); }
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
      });
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
      req.on('error', e => { if (retries > 0) { retries--; setTimeout(doReq, 1000); } else reject(e); });
      req.end();
    };
    doReq();
  });
}

async function getRepo(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}`, token);
}

async function getContributors(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=50`, token);
}

async function getLanguages(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, token);
}

async function getCommitActivity(owner, repo, token) {
  return fetch(`https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`, token);
}

function line(text, width = 78) {
  return `│ ${text}${' '.repeat(width - text.length - 3)}│`;
}

function bar(value, max, width = 20, c = 'blue') {
  if (!max) max = 1;
  const fill = Math.round((value / max) * width);
  return color(c, '█'.repeat(fill)) + '░'.repeat(width - fill);
}

async function main() {
  const args = process.argv.slice(2);
  let repo = 'facebook/react';
  let token = process.env.GITHUB_TOKEN;
  let limit = 10;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-t' || args[i] === '--token') token = args[++i];
    else if (args[i] === '--json') { token = process.env.GITHUB_TOKEN; }
    else if (args[i] === '-l' || args[i] === '--limit') limit = parseInt(args[++i]);
    else if (args[i] === '-h' || args[i] === '--help') {
      console.log('Usage: gitstats <owner/repo> [options]');
      console.log('Options: -t <token>  -l <n>  --json  -h');
      return;
    }
    else if (!args[i].startsWith('-')) repo = args[i];
  }

  const [owner, name] = repo.split('/');
  if (!owner || !name) return console.log(color('red', 'Use owner/repo format'));

  console.log(color('dim', 'Fetching data...'));

  try {
    const [repoData, contributors, languages] = await Promise.all([
      getRepo(owner, name, token),
      getContributors(owner, name, token).catch(() => []),
      getLanguages(owner, name, token).catch(() => ({})),
    ]);

    let commitActivity = null;
    try { commitActivity = await getCommitActivity(owner, name, token); } catch {}

    const W = 78;
    console.log(`\n${color('cyan')}╔${'═'.repeat(W - 2)}╗`);
    console.log(`║ ${color('bright', repoData.full_name)}${' '.repeat(Math.max(1, W - repoData.full_name.length - 20))}★ ${repoData.stargazers_count}  🍴 ${repoData.forks_count} ║`);
    console.log(`║ ${color('gray', `License: ${repoData.license?.name || 'N/A'}  │  Created: ${new Date(repoData.created_at).toLocaleDateString()}`)}${' '.repeat(W - 58)}║`);
    console.log(`╚${'═'.repeat(W - 2)}╝${COLORS.reset}`);

    if (contributors.length > 0) {
      console.log(`\n${color('yellow', '▸ CONTRIBUTORS')}`);
      const maxC = Math.max(...contributors.slice(0, limit).map(c => c.contributions));
      contributors.slice(0, limit).forEach(c => {
        const pct = ((c.contributions / maxC) * 100).toFixed(1);
        console.log(line(` ${bar(c.contributions, maxC, 12, 'green')} ${color('white', c.login.padEnd(16))} ${color('cyan', c.contributions.toString().padStart(5))} (${pct}%) `, W));
      });
    }

    if (Object.keys(languages).length > 0) {
      console.log(`\n${color('yellow', '▸ LANGUAGES')}`);
      const total = Object.values(languages).reduce((a, b) => a + b, 0);
      Object.entries(languages).sort((a, b) => b[1] - a[1]).slice(0, limit).forEach(([lang, bytes], i) => {
        const pct = ((bytes / total) * 100).toFixed(1);
        console.log(line(` ${color(LANE_COLORS[i % LANE_COLORS.length], '●')} ${lang.padEnd(12)} ${color('white', pct.padStart(6) + '%')} ${bar(bytes, total, 16, LANE_COLORS[i % LANE_COLORS.length])} `, W));
      });
    }

    if (commitActivity && commitActivity.length > 0) {
      try {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekTotals = Array(7).fill(0);
        commitActivity.forEach(w => { if (w.days) w.days.forEach((c, d) => { if (c > 0) weekTotals[d] += c; }); });
        const maxD = Math.max(...weekTotals.filter(x => x > 0)) || 1;
        console.log(`\n${color('yellow', '▸ ACTIVITY')}`);
        console.log(line(` ${days.map((d, i) => color('cyan', d.padStart(3)) + ':' + bar(weekTotals[i], maxD, 8)).join('  ')} `, W));
      } catch (e) {}
    }

  } catch (err) {
    console.log(color('red', `\nError: ${err.message}`));
    process.exit(1);
  }
}

main();