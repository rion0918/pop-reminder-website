import { access, readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const legalPages = await Promise.all(
  ['privacy.html', 'terms.html'].map(async (file) => [file, await readFile(file, 'utf8')]),
);
const requiredFiles = [
  'privacy.html',
  'terms.html',
  'styles.css',
  'main.js',
  'robots.txt',
  'sitemap.xml',
  'site.webmanifest',
  'public/assets/app-icon.png',
  'public/assets/icon-192.png',
  'public/assets/app-screen-home.png',
  'public/assets/app-screen-detail.jpg',
  'public/assets/widget-preview.png',
  'public/assets/og-image.png',
];

const requiredPatterns = [
  ['Japanese language declaration', /<html lang="ja">/],
  ['page title', /<title>[^<]+<\/title>/],
  ['meta description', /<meta\s+name="description"/],
  ['canonical URL', /rel="canonical"/],
  ['Open Graph image', /property="og:image"/],
  ['structured data', /application\/ld\+json/],
  ['single primary heading', /<h1\b/],
  ['reduced motion styles', /prefers-reduced-motion/],
];

const failures = [];

for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    failures.push(`Missing file: ${file}`);
  }
}

for (const [label, pattern] of requiredPatterns) {
  if (!pattern.test(html) && !(label === 'reduced motion styles' && pattern.test(await readFile('styles.css', 'utf8')))) {
    failures.push(`Missing ${label}`);
  }
}

const h1Count = (html.match(/<h1\b/g) ?? []).length;
if (h1Count !== 1) failures.push(`Expected one h1, found ${h1Count}`);

const structuredData = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
try {
  JSON.parse(structuredData ?? '');
} catch {
  failures.push('Structured data is not valid JSON');
}

for (const [file, source] of legalPages) {
  if (!/<title>[^<]+<\/title>/.test(source)) failures.push(`Missing title in ${file}`);
  if (!/name="description"/.test(source)) failures.push(`Missing description in ${file}`);
  if (!/rel="canonical"/.test(source)) failures.push(`Missing canonical URL in ${file}`);
  if ((source.match(/<h1\b/g) ?? []).length !== 1) failures.push(`Expected one h1 in ${file}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Site structure and SEO checks passed.');
}
