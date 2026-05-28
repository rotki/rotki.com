---
slug: firebird-finance
label: "Firebird Finance"
type: protocol
image: "/img/integrations/firebird-finance.png"
tagline: "Firebird aggregator swaps across five EVM chains, decoded"
intro: "rotki decodes Firebird Finance aggregator swaps by re-tagging the spend and receive transfers around the Firebird router as a clean trade pair against the Firebird counterparty."
keywords: "firebird finance portfolio tracker, firebird aggregator, firebird defi tax"
features:
  - "Swap-out and swap-in legs through the Firebird router are paired into a single trade event so the input and output of each swap are linked."
  - "Each leg is tagged against the Firebird Finance counterparty, so aggregator activity is distinguishable from direct DEX trades in your history."
  - "Decoded on every chain Firebird currently runs on: Ethereum, Arbitrum One, Optimism, Polygon PoS, and BNB Smart Chain."
setup:
  - "In rotki, add the addresses you use with Firebird on Ethereum, Arbitrum, Optimism, Polygon PoS, and/or BNB Smart Chain."
  - "In rotki, open History and let the initial sync run. Firebird router swaps are decoded automatically into trade pairs."
faq:
  - q: "Are Firebird trades distinguishable from direct DEX swaps?"
    a: "Yes. Both legs of a Firebird swap are tagged against the Firebird Finance counterparty, so aggregator routing is visible in your history rather than being attributed to the underlying pools."
  - q: "Does rotki read Firebird trades from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
