---
slug: optimism
label: "Optimism"
type: blockchain
image: "/img/integrations/optimism.svg"
tagline: "Optimism L2 transactions, decoded locally"
intro: "Add your Optimism addresses to rotki to track OP and token balances, decoded transaction history, and DeFi activity. You choose which Optimism RPC endpoint handles the queries."
metaDescription: "Add your Optimism addresses to rotki to track OP and token balances, decoded transaction history, and DeFi activity."
keywords: "optimism portfolio tracker, op wallet tracker, optimism tax report, optimism defi tracker, l2 portfolio tracker"
features:
  - "Native, ETH, and ERC-20 token balances tracked for your Optimism addresses."
  - "Transactions decoded into readable events: swaps, transfers, bridges, and protocol interactions."
  - "DeFi protocols decoded on Optimism, including Velodrome, Aave, Curve, Balancer, Uniswap, and more."
  - "Superchain bridge deposits and withdrawals linked across Ethereum and Optimism."
  - "Reuse an Ethereum address on Optimism in rotki."
setup:
  - "In rotki, open Blockchain & Accounts → Optimism → Add address."
  - "Paste your address (you can reuse the same one you use on Ethereum)."
  - "Optional: in Settings → RPC, set your preferred Optimism RPC endpoint."
faq:
  - q: "Which Optimism RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Optimism RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Can I track the same address on Ethereum and Optimism?"
    a: "Yes. Add it under both chains; rotki keeps balances and history separate per chain but lets you view a unified portfolio."
  - q: "Are L1-to-L2 bridge transactions decoded?"
    a: "Yes. rotki links the L1 deposit/withdrawal events with their counterpart on Optimism so your transfers are not double-counted."
screenshots: []
ctaPlan: free
---
