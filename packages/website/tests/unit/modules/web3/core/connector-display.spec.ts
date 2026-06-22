import { describe, expect, it } from 'vitest';
import { type ConnectorLike, getConnectorDisplay, isDetectedInjected, omitGenericInjected, sortConnectors } from '~/modules/web3/core/connector-display';

function connector(partial: Partial<ConnectorLike> & Pick<ConnectorLike, 'id' | 'name'>): ConnectorLike {
  return { ...partial };
}

describe('getConnectorDisplay', () => {
  it('prefers a wallet\'s own announced name and icon (EIP-6963)', () => {
    const result = getConnectorDisplay(connector({ icon: 'data:image/png;base64,abc', id: 'io.metamask', name: 'MetaMask' }));
    expect(result).toEqual({ icon: 'data:image/png;base64,abc', name: 'MetaMask' });
  });

  it('brands the Coinbase connector when it ships no icon', () => {
    const result = getConnectorDisplay(connector({ id: 'coinbaseWalletSDK', name: 'Coinbase Wallet', type: 'coinbaseWallet' }));
    expect(result.name).toBe('Coinbase Wallet');
    expect(result.icon).toContain('data:image/svg+xml');
  });

  it('brands the WalletConnect connector by type', () => {
    const result = getConnectorDisplay(connector({ id: 'walletConnect', name: 'WalletConnect', type: 'walletConnect' }));
    expect(result.name).toBe('WalletConnect');
    expect(result.icon).toContain('data:image/svg+xml');
  });

  it('relabels the bare injected shim to "Browser Wallet"', () => {
    const result = getConnectorDisplay(connector({ id: 'injected', name: 'Injected' }));
    expect(result).toEqual({ name: 'Browser Wallet' });
  });

  it('falls back to the connector name with no icon for unknown connectors', () => {
    const result = getConnectorDisplay(connector({ id: 'custom', name: 'Custom Wallet' }));
    expect(result).toEqual({ name: 'Custom Wallet' });
  });
});

describe('isDetectedInjected', () => {
  it('is true for an EIP-6963 announced wallet', () => {
    expect(isDetectedInjected(connector({ id: 'io.metamask', name: 'MetaMask', type: 'injected' }))).toBe(true);
  });

  it('is false for the generic injected shim', () => {
    expect(isDetectedInjected(connector({ id: 'injected', name: 'Injected', type: 'injected' }))).toBe(false);
  });

  it('is false for non-injected connectors', () => {
    expect(isDetectedInjected(connector({ id: 'walletConnect', name: 'WalletConnect', type: 'walletConnect' }))).toBe(false);
  });
});

describe('omitGenericInjected', () => {
  it('drops the generic injected entry when wallets were detected', () => {
    const list = [
      connector({ id: 'injected', name: 'Injected', type: 'injected' }),
      connector({ icon: 'data:,', id: 'io.metamask', name: 'MetaMask', type: 'injected' }),
      connector({ id: 'walletConnect', name: 'WalletConnect', type: 'walletConnect' }),
    ];
    expect(omitGenericInjected(list).map(c => c.id)).toEqual(['io.metamask', 'walletConnect']);
  });

  it('keeps the generic injected entry as a fallback when nothing was detected', () => {
    const list = [
      connector({ id: 'injected', name: 'Injected', type: 'injected' }),
      connector({ id: 'walletConnect', name: 'WalletConnect', type: 'walletConnect' }),
    ];
    expect(omitGenericInjected(list).map(c => c.id)).toEqual(['injected', 'walletConnect']);
  });
});

describe('sortConnectors', () => {
  it('puts injected wallets first while preserving relative order', () => {
    const list = [
      connector({ id: 'coinbaseWalletSDK', name: 'Coinbase Wallet', type: 'coinbaseWallet' }),
      connector({ id: 'io.metamask', name: 'MetaMask', type: 'injected' }),
      connector({ id: 'walletConnect', name: 'WalletConnect', type: 'walletConnect' }),
      connector({ id: 'io.rabby', name: 'Rabby', type: 'injected' }),
    ];
    expect(sortConnectors(list).map(c => c.id)).toEqual(['io.metamask', 'io.rabby', 'coinbaseWalletSDK', 'walletConnect']);
  });
});
