---
slug: llamazip
label: "LlamaZip"
type: protocol
image: "/img/integrations/llamazip.png"
tagline: "LlamaZip calldata-optimised swaps, decoded locally"
intro: "rotki decodes LlamaZip swaps, DefiLlama's calldata-optimised swap router built for L2 cost savings. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes LlamaZip swaps, DefiLlama's calldata-optimised swap router built for L2 cost savings. You choose which RPC endpoint handles the queries."
keywords: "llamazip portfolio tracker, llamazip defi tax, defillama swap"
features:
  - "LlamaZip swaps decoded as swap events."
  - "Decoded on Arbitrum and Optimism, where LlamaZip is deployed."
setup:
  - "In rotki, add your Arbitrum or Optimism address."
  - "Open History and let the initial sync run. LlamaZip swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for LlamaZip activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
