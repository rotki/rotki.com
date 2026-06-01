---
slug: balancer
label: "Balancer"
type: protocol
image: "/img/integrations/balancer.svg"
tagline: "Balancer portfolio tracker - v1, v2, and v3 pools, decoded"
intro: "rotki decodes Balancer v1, v2, and v3 swaps, LP positions, and v3 gauge rewards across Ethereum, Arbitrum, Optimism, Polygon, Base, and Gnosis."
keywords: "balancer portfolio tracker, balancer v3 tracker, balancer lp tracker, balancer gauge rewards"
features:
  - "Balancer v1 - pool swaps on Ethereum decoded as trades."
  - "Balancer v2 - multi-hop swaps and swaps that involve the native chain token decoded as single trade events."
  - "Balancer v3 - swaps, LP deposits/withdrawals, and LP balances tracked."
  - "Balancer v3 gauges - reward claims decoded as income events."
  - "Multi-chain - Ethereum, Arbitrum, Optimism, Polygon, Base, and Gnosis."
setup:
  - "In rotki, add your address under the chain where you use Balancer."
  - "Balancer activity is decoded automatically; LP balances appear in your portfolio."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "Do my Balancer positions or addresses leave my machine?"
    a: "No. rotki reads activity from the RPC nodes you configure directly from your computer."
  - q: "Which Balancer versions does rotki support?"
    a: "v1 (Ethereum), v2, and v3 are all decoded. v3 includes LP balance tracking and gauge reward claims."
  - q: "Are Balancer gauge rewards captured?"
    a: "Yes. v3 gauge reward claims are decoded as income events."
screenshots: []
ctaPlan: free
---
