---
slug: jito
label: "Jito"
type: protocol
image: "/img/integrations/jito_light.png"
tagline: "Jito MEV tips on Solana, decoded locally"
intro: "rotki recognises the Jito tips you pay on Solana and labels them as fee events, alongside the rest of your portfolio. Processing is local; you choose which Solana RPC endpoint handles the queries."
metaDescription: "rotki recognises the Jito tips you pay on Solana and labels them as fee events, alongside the rest of your portfolio."
keywords: "Jito portfolio tracker, Jito accounting, Jito tax, Jito tips, solana mev"
features:
  - "Jito tip payments on Solana recognised as fee events with the Jito counterparty."
limitations:
  - "Only Jito tip payments are decoded. JitoSOL staking and restaking balances are not tracked separately."
setup:
  - "In rotki, add your Solana address."
  - "Open History and let the initial sync run. Jito tips in your transactions are labelled automatically."
faq:
  - q: "Which Solana RPC does rotki use for Jito activity?"
    a: "rotki is a local application that talks directly to the Solana RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
