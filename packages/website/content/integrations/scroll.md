---
slug: scroll
label: "Scroll"
type: blockchain
image: "/img/integrations/scroll.svg"
tagline: "Scroll zkEVM balances, transactions, and DeFi, locally tracked"
intro: "Add your Scroll addresses to rotki to track ETH and ERC-20 balances, decoded transactions, bridge transfers, and DeFi activity on the Scroll zkEVM. You choose which Scroll RPC endpoint handles the queries."
metaDescription: "Add your Scroll addresses to rotki to track ETH and ERC-20 balances, decoded transactions, bridge transfers, and DeFi activity on the Scroll zkEVM."
keywords: "scroll portfolio tracker, scroll zkevm tracker, scroll tax report, scroll defi tracker"
features:
  - "ETH and ERC-20 token balances tracked for your Scroll addresses."
  - "Transactions decoded into readable events: swaps, transfers, bridges, and DeFi interactions."
  - "DeFi protocols decoded on Scroll, including Aave, Compound, KyberSwap, SushiSwap, and Morpho."
  - "Scroll-to-Ethereum bridge transfers linked across both chains."
setup:
  - "In rotki, open Blockchain & Accounts → Scroll → Add address."
  - "Paste your address."
  - "Optional: in Settings → RPC, configure your preferred Scroll RPC endpoint."
faq:
  - q: "Which Scroll RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Scroll RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are Scroll bridge transactions decoded?"
    a: "Yes. Scroll-to-Ethereum bridge transfers are linked across both chains so they aren't double-counted."
screenshots: []
ctaPlan: free
---
