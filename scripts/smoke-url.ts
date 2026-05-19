export {};

const [url, expectedText] = Bun.argv.slice(2);

if (!url || !expectedText) {
  console.error('Usage: bun scripts/smoke-url.ts <url> <expected text>');
  process.exit(2);
}

const response = await fetch(url, { redirect: 'follow' });

if (!response.ok) {
  console.error(`Smoke test failed: ${url} returned ${response.status}`);
  process.exit(1);
}

const body = await response.text();

if (!body.includes(expectedText)) {
  console.error(
    `Smoke test failed: ${url} did not include expected text "${expectedText}"`,
  );
  process.exit(1);
}

console.log(`Smoke test passed: ${url}`);
