/**
 * Presentation metadata for a wallet connector shown in the picker.
 *
 * A wallet discovered via EIP-6963 already announces its own `name` + `icon`, so
 * those are preferred. Known wagmi connectors (Coinbase, WalletConnect) and the
 * legacy injected shim ship without an icon, so we supply a recognizable brand
 * icon and a friendlier label here.
 */
export interface ConnectorLike {
  id: string;
  name: string;
  type?: string;
  icon?: string;
}

export interface ConnectorDisplay {
  name: string;
  icon?: string;
}

/** A wallet announced via EIP-6963 (its own rdns id, not the generic `injected` shim). */
export function isDetectedInjected(connector: ConnectorLike): boolean {
  return (connector.type ?? '').toLowerCase() === 'injected' && connector.id !== 'injected';
}

/**
 * Drop the generic `injected` connector when EIP-6963 has surfaced real wallets:
 * the picker should list each detected wallet (with its own name + icon) rather
 * than a single opaque "Injected" entry. When nothing was detected, the generic
 * entry is kept as the only browser-wallet fallback.
 */
export function omitGenericInjected<T extends ConnectorLike>(connectors: T[]): T[] {
  const hasDetected = connectors.some(isDetectedInjected);
  return hasDetected ? connectors.filter(connector => connector.id !== 'injected') : connectors;
}

/**
 * Order connectors for the picker: injected/browser wallets first (the user's
 * local wallets), then everything else, preserving relative order within each
 * group. `Array.prototype.sort` is stable, so discovery order is kept.
 */
export function sortConnectors<T extends ConnectorLike>(connectors: T[]): T[] {
  const rank = (connector: ConnectorLike): number => ((connector.type ?? '').toLowerCase() === 'injected' ? 0 : 1);
  return [...connectors].sort((a, b) => rank(a) - rank(b));
}

function svgDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Official Coinbase Wallet mark: blue rounded square, white circle with a square notch.
const COINBASE_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#0052FF"/><path fill-rule="evenodd" clip-rule="evenodd" d="M14 23a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm-2.4-11.6c-.55 0-1 .45-1 1v3.2c0 .55.45 1 1 1h3.2c.55 0 1-.45 1-1v-3.2c0-.55-.45-1-1-1h-3.2Z" fill="#fff"/></svg>',
);

// Official WalletConnect mark: white "signal" arcs on the WalletConnect brand blue.
const WALLETCONNECT_ICON = svgDataUri(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#3B99FC"/><path d="M8.19 10.46a8.21 8.21 0 0 1 11.62 0l.38.39c.16.16.16.42 0 .58l-1.32 1.3a.2.2 0 0 1-.29 0l-.53-.53a5.73 5.73 0 0 0-8.1 0l-.57.56a.2.2 0 0 1-.29 0l-1.32-1.3a.41.41 0 0 1 0-.58l.41-.42Zm14.35 2.67 1.18 1.16c.16.16.16.42 0 .58l-5.3 5.22a.41.41 0 0 1-.58 0l-3.77-3.7a.1.1 0 0 0-.15 0l-3.76 3.7a.41.41 0 0 1-.58 0l-5.3-5.22a.41.41 0 0 1 0-.58l1.18-1.16a.41.41 0 0 1 .58 0l3.77 3.71c.04.04.1.04.15 0l3.76-3.71a.41.41 0 0 1 .58 0l3.77 3.71c.04.04.11.04.15 0l3.77-3.71a.41.41 0 0 1 .57 0Z" fill="#fff"/></svg>',
);

function matches(connector: ConnectorLike, needle: string): boolean {
  return connector.id.toLowerCase().includes(needle) || (connector.type ?? '').toLowerCase().includes(needle);
}

/** Resolve the name + icon to show for a connector in the wallet picker. */
export function getConnectorDisplay(connector: ConnectorLike): ConnectorDisplay {
  // A wallet that announced itself (EIP-6963) carries its real brand icon + name.
  if (connector.icon)
    return { icon: connector.icon, name: connector.name };

  if (matches(connector, 'coinbase'))
    return { icon: COINBASE_ICON, name: 'Coinbase Wallet' };

  if (matches(connector, 'walletconnect'))
    return { icon: WALLETCONNECT_ICON, name: 'WalletConnect' };

  // The bare injected shim has the unhelpful name "Injected".
  if (connector.id === 'injected' || connector.name.toLowerCase() === 'injected')
    return { name: 'Browser Wallet' };

  return { name: connector.name };
}
