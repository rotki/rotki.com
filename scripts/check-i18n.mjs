#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { cac } from 'cac';
import consola from 'consola';

const I18N_FILE = './packages/website/i18n/locales/en.json';
const SEARCH_DIR = './packages/website';
const TEMP_FILE = './.tmp/i18n-key-search.txt';

const cli = cac('check-i18n');

cli
  .command('[...args]', 'Check for unused i18n translation keys')
  .option('-d, --delete', 'Delete unused keys (default: dry-run)', { default: false })
  .action((args, options) => {
    main(options.delete);
  });

cli.help();
cli.version('1.0.0');

/** Flattens nested translation JSON into dot-notation keys. */
function flattenKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, newKey));
    }
    else {
      keys.push(newKey);
    }
  }

  return keys;
}

/**
 * Collects the static prefixes and suffixes of `t()` calls that build their key from a template
 * literal, so keys reachable only that way are not reported as unused.
 */
function findTemplateLiteralPatterns() {
  try {
    // Use rg to list all relevant files, then read and parse them with JS
    const filesCmd = `rg -l 't\\(' ${SEARCH_DIR} --type-add 'vue:*.vue' -t vue -t ts -t js 2>/dev/null || true`;
    const filesList = execSync(filesCmd, { encoding: 'utf8' }).trim();

    if (!filesList)
      return [];

    const files = filesList.split('\n').filter(Boolean);
    const extractedPrefixes = new Set();

    // Matches t(`prefix.${var}`) and t(`prefix.${var}.suffix`).
    const templateLiteralRegex = /t\(`([^`]*\${[^}]+}[^`]*)`\)/g;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        let match;

        // eslint-disable-next-line no-cond-assign -- the usual loop over RegExp#exec matches
        while ((match = templateLiteralRegex.exec(content)) !== null) {
          const fullPattern = match[1]; // e.g., "account.subscriptions.${status}"

          // Extract prefix (before ${)
          const prefixMatch = fullPattern.match(/^([^$]+)\${/);
          if (prefixMatch && prefixMatch[1]) {
            extractedPrefixes.add(prefixMatch[1]);
          }

          // Extract suffix (after })
          const suffixMatch = fullPattern.match(/}\.([.A-Z_a-z]+)$/);
          if (suffixMatch && suffixMatch[1]) {
            extractedPrefixes.add(suffixMatch[1]);
          }
        }
      }
      catch {
        // Skip files we can't read
      }
    }

    return [...extractedPrefixes];
  }
  catch {
    return [];
  }
}

/** Whether `key` starts or ends with one of the template literal patterns. */
function matchesTemplatePattern(key, patterns) {
  for (const pattern of patterns) {
    if (key.startsWith(pattern) || key.endsWith(pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Whether the codebase references `key`, directly or through a template literal pattern.
 *
 * @remarks
 * The key goes to rg through a temp file, which avoids shell escaping issues.
 */
function isKeyUsed(key, templatePatterns = []) {
  try {
    if (!existsSync('./.tmp')) {
      mkdirSync('./.tmp', { recursive: true });
    }

    writeFileSync(TEMP_FILE, key, 'utf8');

    execSync(
      `rg -F -q "$(cat ${TEMP_FILE})" ${SEARCH_DIR} --type-add 'vue:*.vue' -t vue -t ts -t js 2>/dev/null`,
      { stdio: 'pipe' },
    );

    return true;
  }
  catch {
    // rg exits with 1 when nothing matches, so the key may still be used through a template literal.
    return matchesTemplatePattern(key, templatePatterns);
  }
}

/** Deletes a key from a nested object by its dot-notation path. */
function deleteKey(obj, path) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;

  for (const key of keys) {
    if (!current[key])
      return false;
    current = current[key];
  }

  if (current[lastKey] !== undefined) {
    delete current[lastKey];
    return true;
  }
  return false;
}

/** Removes objects that became empty, recursively. */
function cleanEmptyObjects(obj) {
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      cleanEmptyObjects(obj[key]);
      if (Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    }
  }
}

/** Sorts every key into directly used, used through a template literal, or unused, with progress output. */
function classifyKeys(allKeys, templatePatterns) {
  const unusedKeys = [];
  const usedKeys = [];
  const dynamicKeys = [];

  let processed = 0;
  for (const key of allKeys) {
    processed++;
    const percentage = Math.round((processed / allKeys.length) * 100);
    process.stdout.write(`\r  Processing: ${processed}/${allKeys.length} (${percentage}%)  `);

    const directlyUsed = isKeyUsed(key, []);
    const matchesTemplate = !directlyUsed && matchesTemplatePattern(key, templatePatterns);

    if (directlyUsed) {
      usedKeys.push(key);
    }
    else if (matchesTemplate) {
      dynamicKeys.push(key);
    }
    else {
      unusedKeys.push(key);
    }
  }

  return { dynamicKeys, unusedKeys, usedKeys };
}

/** Deletes the unused keys from en.json, then drops any objects left empty. */
function removeUnusedKeys(i18nContent, unusedKeys) {
  consola.start('Removing unused keys from en.json...');

  let removed = 0;
  for (const key of unusedKeys) {
    if (deleteKey(i18nContent, key)) {
      removed++;
    }
  }

  consola.start('Cleaning up empty objects...');
  cleanEmptyObjects(i18nContent);

  consola.start('Writing updated file...');
  writeFileSync(I18N_FILE, `${JSON.stringify(i18nContent, null, 2)}\n`, 'utf8');

  consola.success(`Removed ${removed} unused key${removed === 1 ? '' : 's'}!`);
}

/** Lists the unused keys, and removes them in delete mode. */
function reportUnusedKeys(unusedKeys, i18nContent, deleteMode) {
  if (unusedKeys.length === 0) {
    consola.success('All translation keys are being used!');
    return;
  }

  consola.warn(`Found ${unusedKeys.length} unused translation key${unusedKeys.length === 1 ? '' : 's'}:`);
  consola.box(unusedKeys.sort().map(key => `  • ${key}`).join('\n'));

  if (deleteMode) {
    removeUnusedKeys(i18nContent, unusedKeys);
  }
  else {
    consola.info('Run with --delete or -d flag to remove these keys');
  }
}

/** Prints how many keys fell into each group and the share still in use. */
function printSummary({ dynamicKeys, unusedKeys, usedKeys }, totalKeys) {
  const totalUsed = usedKeys.length + dynamicKeys.length;
  consola.box({
    title: 'Summary',
    message: [
      `Directly used keys: ${usedKeys.length}`,
      `Dynamic/template keys: ${dynamicKeys.length}`,
      `Unused keys: ${unusedKeys.length}`,
      `Coverage: ${Math.round((totalUsed / totalKeys) * 100)}%`,
    ].join('\n'),
    style: {
      borderColor: unusedKeys.length === 0 ? 'green' : 'yellow',
    },
  });
}

/** Reports the translation keys nothing references, and removes them when `deleteMode` is set. */
async function main(deleteMode) {
  consola.start(deleteMode ? 'Removing unused i18n keys...' : 'Checking for unused i18n keys...');

  consola.start('Searching for template literal patterns...');
  const templatePatterns = findTemplateLiteralPatterns();
  if (templatePatterns.length > 0) {
    consola.info(`Found ${templatePatterns.length} template literal pattern${templatePatterns.length === 1 ? '' : 's'}:`);
    templatePatterns.forEach((pattern) => {
      consola.info(`  • ${pattern}`);
    });
  }

  const i18nContent = JSON.parse(readFileSync(I18N_FILE, 'utf8'));
  const allKeys = flattenKeys(i18nContent);

  consola.info(`Total translation keys: ${allKeys.length}`);

  const classified = classifyKeys(allKeys, templatePatterns);

  try {
    unlinkSync(TEMP_FILE);
  }
  catch {
    // ignore
  }

  console.log(''); // New line after progress

  if (classified.dynamicKeys.length > 0) {
    consola.info(`Found ${classified.dynamicKeys.length} key${classified.dynamicKeys.length === 1 ? '' : 's'} potentially used in template literals:`);
    consola.box(classified.dynamicKeys.sort().map(key => `  • ${key}`).join('\n'));
  }

  reportUnusedKeys(classified.unusedKeys, i18nContent, deleteMode);
  printSummary(classified, allKeys.length);

  if (deleteMode && classified.unusedKeys.length > 0) {
    consola.info('Don\'t forget to run pnpm build to verify the changes!');
  }
}

cli.parse();
