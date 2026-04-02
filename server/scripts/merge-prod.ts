import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const dataDir = join(__dirname, '../src/data');
const distDataDir = join(__dirname, '../dist/data');

const prodFiles = readdirSync(dataDir).filter(f => f.endsWith('.prod.json'));

if (prodFiles.length === 0) {
  console.log('No *.prod.json files found.');
  process.exit(0);
}

for (const prodFile of prodFiles) {
  const baseName = prodFile.replace('.prod.json', '.json');
  const basePath = join(dataDir, baseName);
  const prodPath = join(dataDir, prodFile);

  if (!existsSync(basePath)) {
    console.warn(`⚠  ${baseName} not found — skipping ${prodFile}`);
    continue;
  }

  const baseData: unknown = JSON.parse(readFileSync(basePath, 'utf-8'));
  const prodData: unknown = JSON.parse(readFileSync(prodPath, 'utf-8'));

  if (!Array.isArray(baseData) || !Array.isArray(prodData)) {
    console.log(`  ${prodFile} — skipped (not an array)`);
    continue;
  }

  const sample = prodData[0] ?? baseData[0];
  const key: string | null =
    sample && typeof sample === 'object' && 'id' in sample
      ? 'id'
      : sample && typeof sample === 'object' && 'day' in sample
        ? 'day'
        : null;

  if (!key) {
    console.warn(`⚠  ${prodFile} — skipped (cannot determine merge key)`);
    continue;
  }

  const existingKeys = new Set(
    (baseData as Record<string, unknown>[]).map(item => item[key])
  );

  const newItems = (prodData as Record<string, unknown>[]).filter(
    item => !existingKeys.has(item[key])
  );

  if (newItems.length === 0) {
    console.log(`  ${baseName} — already up to date`);
    continue;
  }

  const merged = [...(baseData as Record<string, unknown>[]), ...newItems];

  if (key === 'day') {
    merged.sort((a, b) => (a.day as number) - (b.day as number));
  }

  const json = JSON.stringify(merged, null, 2) + '\n';
  writeFileSync(basePath, json);
  console.log(`  ${baseName} — merged ${newItems.length} item(s) from ${prodFile}`);

  const distPath = join(distDataDir, baseName);
  if (existsSync(distPath)) {
    writeFileSync(distPath, json);
    console.log(`  ${baseName} — synced to dist/`);
  }
}
