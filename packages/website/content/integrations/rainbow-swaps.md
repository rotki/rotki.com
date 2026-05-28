---
slug: rainbow-swaps
label: "Rainbow Swaps"
type: protocol
image: "/img/integrations/rainbow.svg"
tagline: "Rainbow Wallet swaps, decoded locally"
intro: "rotki decodes swaps executed through the Rainbow Wallet swap router, including the Rainbow fee. You choose which RPC endpoint handles the queries."
keywords: "rainbow swaps tracker, rainbow wallet swap, rainbow defi tax"
features:
  - "Rainbow Wallet swaps decoded as swap events, with the Rainbow fee recognised."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, and BNB Smart Chain."
setup:
  - "In rotki, add the EVM address you use in Rainbow Wallet."
  - "Open History and let the initial sync run. Rainbow swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Rainbow swap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
