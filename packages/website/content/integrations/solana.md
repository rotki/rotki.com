---
slug: solana
label: "Solana"
type: blockchain
image: "/img/integrations/solana.svg"
tagline: "Solana SOL, SPL tokens, and staking, locally tracked"
intro: "Add your Solana addresses to rotki to track SOL, staked SOL, and SPL token balances with decoded transaction history. Jupiter swaps, Jito tips, and Jupiter Lend activity are recognised automatically. You choose which Solana RPC endpoint handles the queries."
metaDescription: "Add your Solana addresses to rotki to track SOL, staked SOL, and SPL token balances with decoded transaction history."
keywords: "solana portfolio tracker, sol wallet tracker, solana tax report, sol staking tracker, jupiter swap tracker, spl token tracker"
features:
  - "SOL, staked SOL, and SPL token balances tracked for your Solana addresses."
  - "Staked SOL summed from your stake accounts and included in your portfolio."
  - "Jupiter aggregator swaps decoded as trade events."
  - "Jito tips recognised as fee events."
  - "Jupiter Lend activity (deposits, withdrawals, borrows, repays) decoded as events."
limitations:
  - "Solana support is early: balances, staking, and a growing set of protocols (Jupiter, Jito) are covered, but decoding is not yet as extensive as on EVM chains."
setup:
  - "In rotki, open Blockchain & Accounts → Solana → Add address."
  - "Paste your Solana address. rotki validates the format and rejects invalid addresses."
  - "Optional: in Settings → RPC, configure your preferred Solana RPC endpoint."
faq:
  - q: "Which Solana RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Solana RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Does rotki include staked SOL?"
    a: "Yes. Both native SOL and staked SOL balances are counted in your Solana portfolio."
  - q: "Are Jupiter swaps and Jito tips decoded?"
    a: "Yes. rotki decodes Jupiter aggregator swaps as trades and recognises Jito tip payments as fee events."
screenshots: []
ctaPlan: free
---
