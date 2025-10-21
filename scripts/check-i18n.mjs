#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { cac } from 'cac';
import consola from 'consola';

const I18N_FILE = './packages/website/i18n/locales/en.json';
const SEARCH_DIR = './packages/website';
const TEMP_FILE = './.tmp/i18n-key-search.txt';

// Parse command line arguments
const cli = cac('check-i18n');

cli
  .command('[...args]', 'Check for unused i18n translation keys')
  .option('-d, --delete', 'Delete unused keys (default: dry-run)', { default: false })
  .action((args, options) => {
    main(options.delete);
  });

cli.help();
cli.version('1.0.0');

async function main(deleteMode) {
// Flatten nested JSON to dot notation keys
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

  // Find all template literal patterns in the codebase
  function findTemplateLiteralPatterns() {
    try {
      // Use rg to list all relevant files, then read and parse them with JS
      const filesCmd = `rg -l 't\\(' ${SEARCH_DIR} --type-add 'vue:*.vue' -t vue -t ts -t js 2>/dev/null || true`;
      const filesList = execSync(filesCmd, { encoding: 'utf8' }).trim();

      if (!filesList)
        return [];

      const files = filesList.split('\n').filter(Boolean);
      const extractedPrefixes = new Set();

      // Regex to match template literal t() calls with variables
      // Matches: t(`prefix.${var}`) or t(`prefix.${var}.suffix`)
      const templateLiteralRegex = /t\(`([^`]*\${[^}]+}[^`]*)`\)/g;

      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf8');
          let match;

          // eslint-disable-next-line no-cond-assign
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

  // Check if a key matches any template literal pattern
  function matchesTemplatePattern(key, patterns) {
    for (const pattern of patterns) {
    // Check if the key starts with or ends with the pattern
      if (key.startsWith(pattern) || key.endsWith(pattern)) {
        return true;
      }
    }
    return false;
  }

  // Search for key usage in codebase
  function isKeyUsed(key, templatePatterns = []) {
    try {
    // Ensure .tmp directory exists
      if (!existsSync('./.tmp')) {
        mkdirSync('./.tmp', { recursive: true });
      }

      // Write key to temp file to avoid shell escaping issues
      writeFileSync(TEMP_FILE, key, 'utf8');

      // Use rg with fixed string search (-F) and read pattern from file
      execSync(
        `rg -F -q "$(cat ${TEMP_FILE})" ${SEARCH_DIR} --type-add 'vue:*.vue' -t vue -t ts -t js 2>/dev/null`,
        { stdio: 'pipe' },
      );

      return true;
    }
    catch {
    // rg returns exit code 1 when no matches found
    // Check if it might be used in a template literal
      return matchesTemplatePattern(key, templatePatterns);
    }
  }

  // Delete a key from nested object by dot notation path
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

  // Clean up empty objects recursively
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

  consola.start(deleteMode ? 'Removing unused i18n keys...' : 'Checking for unused i18n keys...');

  // Find template literal patterns
  consola.start('Searching for template literal patterns...');
  const templatePatterns = findTemplateLiteralPatterns();
  if (templatePatterns.length > 0) {
    consola.info(`Found ${templatePatterns.length} template literal pattern${templatePatterns.length === 1 ? '' : 's'}:`);
    templatePatterns.forEach((pattern) => {
      consola.info(`  • ${pattern}`);
    });
  }

  // Read and parse i18n file
  const i18nContent = JSON.parse(readFileSync(I18N_FILE, 'utf8'));
  const allKeys = flattenKeys(i18nContent);

  consola.info(`Total translation keys: ${allKeys.length}`);

  // Check each key
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

  // Cleanup temp file
  try {
    unlinkSync(TEMP_FILE);
  }
  catch {
  // ignore
  }

  console.log(''); // New line after progress

  // Display dynamic keys info
  if (dynamicKeys.length > 0) {
    consola.info(`Found ${dynamicKeys.length} key${dynamicKeys.length === 1 ? '' : 's'} potentially used in template literals:`);
    consola.box(dynamicKeys.sort().map(key => `  • ${key}`).join('\n'));
  }

  // Display results
  if (unusedKeys.length === 0) {
    consola.success('All translation keys are being used!');
  }
  else {
    consola.warn(`Found ${unusedKeys.length} unused translation key${unusedKeys.length === 1 ? '' : 's'}:`);
    consola.box(unusedKeys.sort().map(key => `  • ${key}`).join('\n'));

    if (deleteMode) {
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
    else {
      consola.info('Run with --delete or -d flag to remove these keys');
    }
  }

  // Summary
  const totalUsed = usedKeys.length + dynamicKeys.length;
  consola.box({
    title: 'Summary',
    message: [
      `Directly used keys: ${usedKeys.length}`,
      `Dynamic/template keys: ${dynamicKeys.length}`,
      `Unused keys: ${unusedKeys.length}`,
      `Coverage: ${Math.round((totalUsed / allKeys.length) * 100)}%`,
    ].join('\n'),
    style: {
      borderColor: unusedKeys.length === 0 ? 'green' : 'yellow',
    },
  });

  if (deleteMode && unusedKeys.length > 0) {
    consola.info('Don\'t forget to run pnpm build to verify the changes!');
  }
}

cli.parse();
