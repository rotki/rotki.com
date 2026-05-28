---
slug: magpie
label: "Magpie"
type: protocol
image: "/img/integrations/magpie.png"
tagline: "Magpie aggregator swaps, decoded locally"
intro: "rotki decodes Magpie aggregator trades across several EVM chains. You choose which RPC endpoint handles the queries."
keywords: "magpie portfolio tracker, magpie aggregator, magpie defi tax"
features:
  - "Magpie aggregator swaps decoded as swap events."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, Gnosis, BNB Smart Chain, and Scroll."
setup:
  - "In rotki, add your address under a chain where you've used Magpie."
  - "Open History and let the initial sync run. Magpie swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Magpie activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
