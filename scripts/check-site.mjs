import { access, readFile } from 'node:fs/promises';

const html = await readFile('index.html', 'utf8');
const wrangler = await readFile('wrangler.toml', 'utf8');
const waitlistFunction = await readFile('functions/api/waitlist.js', 'utf8');
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
  '_routes.json',
  'wrangler.toml',
  'functions/api/waitlist.js',
  'migrations/0001_create_waitlist_signups.sql',
  'public/assets/app-icon.png',
  'public/assets/icon-192.png',
  'public/assets/app-screen-home-dream-hd.png',
  'public/assets/og-image-dream.png',
];

const requiredPatterns = [
  ['Japanese language declaration', /<html lang="ja">/],
  ['page title', /<title>[^<]+<\/title>/],
  ['meta description', /<meta\s+name="description"/],
  ['canonical URL', /rel="canonical"/],
  ['Open Graph image', /property="og:image"/],
  ['structured data', /application\/ld\+json/],
  ['single primary heading', /<h1\b/],
  ['app-style reminder bubbles', /data-reminder-bubble/],
  ['high-resolution Dream hero screen', /app-screen-home-dream-hd\.png/],
  ['generic widget copy', /class="overline">Widget</],
  ['waitlist form', /data-waitlist-form/],
  ['waitlist privacy note', /メールアドレスの登録はありません/],
  ['developer X account', /https:\/\/x\.com\/rioi7_0918/],
  ['reduced motion styles', /prefers-reduced-motion/],
];

const removedHomepagePatterns = [
  ['detail feature card', /bento-detail/],
  ['hero trust list', /trust-list/],
  ['hero eyebrow', /Simple reminder app/i],
  ['promise eyebrow', /A little less to remember/i],
  ['tracking SDK feature', /広告・解析SDKなし/],
  ['widget preview image', /widget-preview\.png/],
  ['Android-specific widget label', /Android widget/i],
  ['privacy intro copy', /覚えておきたいことは、とても個人的な情報です/],
  ['GitHub footer link', />GitHub<\/a>/],
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

for (const [label, pattern] of removedHomepagePatterns) {
  if (pattern.test(html)) failures.push(`Unexpected ${label}`);
}

const h1Count = (html.match(/<h1\b/g) ?? []).length;
if (h1Count !== 1) failures.push(`Expected one h1, found ${h1Count}`);
if (/reminder-chip/.test(html)) failures.push('Reminder examples must use bubbles, not cards');

const routes = JSON.parse(await readFile('_routes.json', 'utf8'));
if (routes.include?.length !== 1 || routes.include[0] !== '/api/*') {
  failures.push('Pages Functions routes must only include /api/*');
}
if (!/binding = "WAITLIST_DB"/.test(wrangler)) failures.push('Missing WAITLIST_DB binding');
if (!/pages_build_output_dir = "dist"/.test(wrangler)) failures.push('Missing Pages output directory');
if (/request\.cf|cf-connecting-ip|user-agent/i.test(waitlistFunction)) {
  failures.push('Waitlist API must not collect IP or User-Agent data');
}

const privacy = legalPages.find(([file]) => file === 'privacy.html')?.[1] ?? '';
if (!/公式サイトの待機リスト/.test(privacy)) failures.push('Missing waitlist privacy policy');
if (!/同じブラウザから参加を取り消せます/.test(privacy)) failures.push('Missing waitlist removal policy');

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
