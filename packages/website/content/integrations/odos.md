---
slug: odos
label: "Odos"
type: protocol
image: "/img/integrations/odos.svg"
tagline: "Odos aggregator swaps, decoded locally"
intro: "rotki decodes Odos aggregator trades across several EVM chains. You choose which RPC endpoint handles the queries."
keywords: "odos portfolio tracker, odos aggregator, odos defi tax, odos swap history"
features:
  - "Odos aggregator swaps decoded as swap events."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Smart Chain, and Scroll."
setup:
  - "In rotki, add your address under a chain where you've used Odos."
  - "Open History and let the initial sync run. Odos swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Odos activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
