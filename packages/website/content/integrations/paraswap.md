---
slug: paraswap
label: "ParaSwap"
type: protocol
image: "/img/integrations/paraswap.svg"
tagline: "ParaSwap aggregator swaps, decoded locally"
intro: "rotki decodes ParaSwap aggregator trades across several EVM chains. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes ParaSwap aggregator trades across several EVM chains. You choose which RPC endpoint handles the queries."
keywords: "paraswap portfolio tracker, paraswap aggregator, paraswap defi tax, paraswap swap history"
features:
  - "ParaSwap aggregator swaps decoded as swap events."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, Gnosis, and BNB Smart Chain."
setup:
  - "In rotki, add your address under a chain where you've used ParaSwap."
  - "Open History and let the initial sync run. ParaSwap swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for ParaSwap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
