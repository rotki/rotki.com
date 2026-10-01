import type { RuiIcons } from '@rotki/ui-library';

/** Icon per feature guide slug; a new guide falls back to a generic icon until it gets one here. */
const FEATURE_ICONS: Record<string, RuiIcons> = {
  'ai-assistant-mcp': 'lu-bot',
  'csv-import': 'lu-file-spreadsheet',
  'defi-portfolio-tracking': 'lu-blocks',
  'local-first-crypto-accounting': 'lu-laptop-minimal',
  'open-source-crypto-tax': 'lu-code-xml',
  'privacy-first-portfolio-management': 'lu-shield-check',
};

export function featureIcon(slug: string): RuiIcons {
  return FEATURE_ICONS[slug] ?? 'lu-sparkles';
}
