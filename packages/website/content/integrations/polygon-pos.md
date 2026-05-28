---
slug: polygon-pos
label: "Polygon PoS"
type: blockchain
image: "/img/integrations/polygon_pos.svg"
tagline: "Polygon PoS balances, transactions, and DeFi, locally tracked"
intro: "Add your Polygon PoS addresses to rotki to track POL (formerly MATIC) and token balances, decoded transactions, and DeFi activity. You choose which Polygon RPC endpoint handles the queries."
keywords: "polygon portfolio tracker, matic wallet tracker, pol tracker, polygon tax report, polygon defi tracker"
features:
  - "POL (MATIC) and ERC-20 token balances tracked for your Polygon PoS addresses."
  - "Transactions decoded into readable events: swaps, transfers, bridges, and DeFi interactions."
  - "DeFi protocols decoded on Polygon, including Aave, Curve, QuickSwap, and more."
  - "Polygon PoS bridge transfers linked with their Ethereum counterparts."
setup:
  - "In rotki, open Blockchain & Accounts → Polygon PoS → Add address."
  - "Paste your address."
  - "Optional: in Settings → RPC, configure your preferred Polygon RPC endpoint."
faq:
  - q: "Which Polygon RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Polygon RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Is POL (the renamed MATIC) handled correctly?"
    a: "Yes. rotki tracks POL/MATIC under its current asset mapping with correct pricing."
screenshots: []
ctaPlan: free
---
