---
slug: jupiter
label: "Jupiter"
type: protocol
image: "/img/integrations/jupiter.svg"
tagline: "Jupiter swaps and Lend on Solana, decoded locally"
intro: "rotki decodes Jupiter aggregator swaps and Jupiter Lend activity on Solana. Processing is local; you choose which Solana RPC endpoint handles the queries."
metaDescription: "rotki decodes Jupiter aggregator swaps and Jupiter Lend activity on Solana. Processing is local; you choose which Solana RPC endpoint handles the queries."
keywords: "jupiter swap tracker, solana dex aggregator, jupiter lend, jup token tracker, solana defi tax"
features:
  - "Jupiter aggregator swaps, including RFQ fills, decoded as swap events on Solana."
  - "Jupiter Lend deposits, withdrawals, borrows, and repays decoded as events."
  - "Jito tips paid in your Jupiter transactions recognised as fee events."
setup:
  - "In rotki, add your Solana address."
  - "Open History and let the initial sync run. Jupiter swaps and Lend activity are decoded automatically."
faq:
  - q: "Which Solana RPC does rotki use for Jupiter activity?"
    a: "rotki is a local application that talks directly to the Solana RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
