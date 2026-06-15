---
slug: quickswap
label: "QuickSwap"
type: protocol
image: "/img/integrations/quickswap.png"
tagline: "QuickSwap swaps and LP, decoded locally"
intro: "rotki decodes QuickSwap swaps, including native-token swaps (ETH, POL), and tracks your QuickSwap LP balances. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes QuickSwap swaps, including native-token swaps (ETH, POL), and tracks your QuickSwap LP balances."
keywords: "quickswap portfolio tracker, polygon dex tracker, quickswap lp, quickswap defi tax"
features:
  - "QuickSwap swaps decoded as swap events, including native-token (ETH, POL) swaps."
  - "QuickSwap LP positions reflected in your portfolio."
  - "Decoded on Polygon PoS and Base."
setup:
  - "In rotki, add your Polygon PoS or Base address. QuickSwap activity is decoded automatically."
  - "Open History and let the initial sync run."
faq:
  - q: "Which RPC does rotki use for QuickSwap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are POL/MATIC native-token swaps decoded?"
    a: "Yes. QuickSwap native-token swaps are decoded as swap events."
screenshots: []
ctaPlan: free
---
