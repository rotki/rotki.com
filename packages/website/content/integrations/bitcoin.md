---
slug: bitcoin
label: "Bitcoin"
type: blockchain
image: "/img/integrations/bitcoin.svg"
tagline: "Bitcoin portfolio tracker - xpub, taproot, and single addresses"
intro: "Track multiple Bitcoin addresses or whole wallets via xpub/ypub/zpub keys, including Taproot."
metaDescription: "Track multiple Bitcoin addresses or whole wallets via xpub/ypub/zpub keys, including Taproot."
keywords: "bitcoin portfolio tracker, btc wallet tracker, xpub tracker, taproot tracker, bitcoin tax report, btc cost basis"
features:
  - "Single addresses: legacy (P2PKH), SegWit (P2WPKH/Bech32), and Taproot (Bech32m/P2TR)."
  - "xpub / ypub / zpub support: rotki auto-detects the type from the prefix and derives addresses."
  - "Taproot (P2TR) xpubs: supported as a dedicated derivation type when adding a Bitcoin account."
  - "Address-level filtering: slice your Bitcoin event history by individual address even when adding via xpub."
  - "Multi-wallet: combine multiple xpubs and standalone addresses in one rotki instance."
setup:
  - "In rotki, open Blockchain & Accounts → Bitcoin → Add."
  - "Paste either a single Bitcoin address or your extended public key (xpub, ypub, or zpub). For Taproot xpubs, select the P2TR derivation type since Taproot xpubs share the same `xpub` prefix as legacy P2PKH."
  - "Optional: in Settings → RPC, open the Bitcoin Mempool tab to point rotki at a custom mempool.space / Esplora-compatible API (public block explorers are used by default)."
  - "rotki will derive addresses, fetch balances, and pull transaction history."
faq:
  - q: "Where do my xpubs and addresses go?"
    a: "Only to the Bitcoin API you query. By default rotki uses public block explorers (blockchain.info, blockstream.info, mempool.space); you can instead set a custom mempool.space / Esplora-compatible endpoint in Settings → RPC. Either way the request goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Is an xpub safe to share with rotki?"
    a: "An xpub only allows watching balances; it cannot spend funds. rotki stores it locally and uses it from your machine to derive addresses and query balances. Avoid pasting xpubs into remote services in general."
  - q: "Can I run rotki against my own Bitcoin node?"
    a: "rotki queries Bitcoin through a mempool.space / Esplora-style REST API, not the Electrum protocol or Bitcoin Core's RPC. You can self-host mempool.space or an Esplora (electrs) instance and point rotki at it via Settings → RPC → Bitcoin Mempool."
  - q: "Does rotki support Taproot?"
    a: "Yes. rotki supports Taproot (P2TR) xpubs and Bech32m Taproot addresses natively when adding Bitcoin accounts."
  - q: "Is testnet supported?"
    a: "No. rotki tracks mainnet Bitcoin only; testnet prefixes such as vpub are not accepted."
screenshots: []
ctaPlan: free
---
