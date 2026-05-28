---
slug: 1inch
label: "1inch"
type: protocol
image: "/img/integrations/1inch.svg"
tagline: "1inch portfolio tracker - aggregator swaps, including pool-routed"
intro: "rotki decodes 1inch aggregator swaps (v4, v5, and v6, including Fusion-routed) across Ethereum, Arbitrum, Optimism, Polygon, and Gnosis, including swaps that settle through a Balancer pool."
keywords: "1inch portfolio tracker, 1inch aggregator tracker, 1inch defi tax, 1inch swap history"
features:
  - "1inch v4, v5, and v6 aggregator swaps decoded as clean swap events."
  - "Pool-routed swaps - 1inch trades settling via Balancer V2/V3 (including v6 Fusion routing) are folded into a single swap event instead of a separate Balancer trade."
  - "Multi-chain - Ethereum, Arbitrum, Optimism, Polygon, and Gnosis."
setup:
  - "In rotki, add your address under the chain where you've used 1inch."
  - "Activity is decoded automatically."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "Do my 1inch trades leave my machine?"
    a: "No. rotki reads activity from the RPC nodes you configure directly from your computer."
screenshots: []
ctaPlan: free
---
