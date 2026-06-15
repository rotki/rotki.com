---
slug: mintclub
label: "MintClub"
type: protocol
image: "/img/integrations/mintclub.svg"
tagline: "MintClub distribution claims on Base, decoded locally"
intro: "rotki decodes the token claims you make from MintClub distributions on Base. You choose which Base RPC endpoint handles the queries."
metaDescription: "rotki decodes the token claims you make from MintClub distributions on Base. You choose which Base RPC endpoint handles the queries."
keywords: "mintclub portfolio tracker, mintclub accounting, mintclub tax, mintclub claim"
features:
  - "MintClub distribution claims decoded as income events with the MintClub counterparty."
limitations:
  - "Only MintClub distribution claims are decoded, on Base."
setup:
  - "In rotki, add your Base address."
  - "Open History and let the initial sync run. MintClub claims are decoded automatically."
faq:
  - q: "Which Base RPC does rotki use for MintClub activity?"
    a: "rotki is a local application that talks directly to the Base RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
