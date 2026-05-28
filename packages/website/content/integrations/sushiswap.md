---
slug: sushiswap
label: "SushiSwap"
type: protocol
image: "/img/integrations/sushiswap.svg"
tagline: "SushiSwap swaps and LP positions, decoded locally"
intro: "rotki decodes SushiSwap swaps and tracks liquidity-provider balances, including swaps routed through the RedSnwapper and Route Processor routers. You choose which RPC endpoint handles the queries."
keywords: "sushiswap portfolio tracker, sushi defi tracker, sushi lp tracker, sushiswap swap history"
features:
  - "SushiSwap swaps decoded as swap events."
  - "SushiSwap LP balances reflected in the LP tokens view."
  - "Swaps through the RedSnwapper (RP5/RP6) and older Route Processor routers decoded."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, Gnosis, BNB Smart Chain, Scroll, and Hyperliquid."
setup:
  - "In rotki, add your address under a chain where you've used SushiSwap."
  - "Open History and let the initial sync run. SushiSwap activity is decoded automatically."
faq:
  - q: "Which RPC does rotki use for SushiSwap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are RedSnwapper router swaps decoded?"
    a: "Yes. SushiSwap RedSnwapper (RP5/RP6) and older Route Processor router swaps are decoded."
screenshots: []
ctaPlan: free
---
