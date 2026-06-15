---
slug: hyperliquid
label: "Hyperliquid"
type: blockchain
image: "/img/integrations/hyperliquid.svg"
tagline: "Hyperliquid (HyperEVM) wallet tracking and decoded DeFi activity"
intro: "rotki tracks Hyperliquid (HyperEVM) addresses as an EVM chain: HYPE and ERC-20 balances per address, transaction decoding, and counterparty-tagged DeFi events for the protocols rotki ships with on Hyperliquid."
metaDescription: "rotki tracks Hyperliquid (HyperEVM) addresses as an EVM chain: HYPE and ERC-20 balances per address, transaction decoding, and counterparty-tagged DeFi events"
keywords: "hyperliquid portfolio tracker, hyperevm wallet tracker, hyperliquid defi, hype tracker"
features:
  - "HYPE (native gas) and ERC-20 token balances per tracked Hyperliquid address."
  - "Transaction history decoded into readable events using the Hyperliquid RPC you configure."
  - "Counterparty-tagged decoders on Hyperliquid include Curve, Sushiswap, KyberSwap, Morpho, Morpho Blue, WOOFi, and Circle CCTP."
limitations:
  - "Hyperliquid's perpetuals DEX and the HYPE genesis distribution are not currently decoded as Hyperliquid-counterparty events. Token movements appear as ordinary ERC-20 events."
setup:
  - "In rotki, open Blockchain Balances → Hyperliquid → Add address."
  - "Optional: configure your preferred Hyperliquid RPC endpoint in Settings."
  - "In rotki, open History and let the initial sync run. Balances and decoded events populate automatically."
faq:
  - q: "Are Hyperliquid perpetual positions tracked?"
    a: "Not as Hyperliquid-counterparty events. The current Hyperliquid integration covers on-chain HyperEVM activity (balances and decoded DeFi events). The off-chain perpetual order book is not pulled into rotki."
  - q: "Was the HYPE genesis distribution decoded?"
    a: "Not as a Hyperliquid-counterparty event. The HYPE you received appears as an ordinary token receive on the address."
  - q: "Where do my Hyperliquid address queries go?"
    a: "rotki is a local application that talks directly to the Hyperliquid RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
