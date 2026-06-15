---
slug: velodrome-finance
label: "Velodrome Finance"
type: protocol
image: "/img/integrations/velodrome.png"
tagline: "Velodrome swaps, LP, gauges, and veVELO, decoded locally"
intro: "rotki decodes Velodrome swaps, liquidity-pool positions, gauge reward claims, and veVELO locking on Optimism. You choose which Optimism RPC endpoint handles the queries."
metaDescription: "rotki decodes Velodrome swaps, liquidity-pool positions, gauge reward claims, and veVELO locking on Optimism."
keywords: "velodrome portfolio tracker, velo defi tracker, velodrome lp, ve velo tracker, optimism dex tracker"
features:
  - "Velodrome swaps decoded as swap events."
  - "Velodrome LP positions tracked, with balances reflected in your portfolio."
  - "Gauge reward claims decoded as income."
  - "veVELO locking decoded."
setup:
  - "In rotki, add your Optimism address. Velodrome activity is decoded automatically."
  - "Optional: refresh Velodrome data under Settings → Manage Data → Refresh protocol data."
  - "Open History and let the initial sync run. Velodrome events are decoded automatically."
faq:
  - q: "Which Optimism RPC does rotki use for Velodrome activity?"
    a: "rotki is a local application that talks directly to the Optimism RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are Velodrome gauge rewards captured?"
    a: "Yes. Gauge reward claims are decoded as income events."
screenshots: []
ctaPlan: free
---
