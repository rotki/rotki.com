---
slug: votium
label: "Votium"
type: protocol
image: "/img/integrations/votium.png"
tagline: "Votium bribe claims, decoded locally"
intro: "rotki decodes Votium bribe claims (the rewards vlCVX holders earn for delegating votes) as income events. You choose which Ethereum RPC endpoint handles the queries."
metaDescription: "rotki decodes Votium bribe claims (the rewards vlCVX holders earn for delegating votes) as income events."
keywords: "votium portfolio tracker, vlcvx bribes, convex vote bribes, votium claim tax"
features:
  - "Votium bribe claims decoded as income events with the Votium counterparty."
  - "Each claimed token is recorded with its own amount and price."
setup:
  - "In rotki, add your Ethereum address."
  - "Open History and let the initial sync run. Votium claims are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Votium activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are bribe claims tax-relevant?"
    a: "rotki decodes them as income events. Talk to a tax professional about treatment in your jurisdiction."
screenshots: []
ctaPlan: free
---
