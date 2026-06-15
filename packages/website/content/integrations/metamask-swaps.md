---
slug: metamask-swaps
label: "MetaMask Swaps"
type: protocol
image: "/img/integrations/metamask.svg"
tagline: "MetaMask in-wallet swaps, decoded locally"
intro: "rotki decodes swaps executed through MetaMask's built-in swap feature. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes swaps executed through MetaMask's built-in swap feature. You choose which RPC endpoint handles the queries."
keywords: "metamask swaps tracker, metamask defi tax, metamask swap history"
features:
  - "MetaMask in-wallet swaps decoded as swap events, with the MetaMask swap fee recognised."
  - "Decoded on Ethereum, Arbitrum, Optimism, Polygon, and BNB Smart Chain."
setup:
  - "In rotki, add the EVM address you use in MetaMask."
  - "Open History and let the initial sync run. MetaMask swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for MetaMask swap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
