---
slug: paladin
label: "Paladin"
type: protocol
image: "/img/integrations/paladin.svg"
tagline: "Paladin Quest bribe claims, decoded locally"
intro: "rotki decodes the reward claims you make from Paladin Quest veCRV bribe markets. You choose which Ethereum RPC endpoint handles the queries."
metaDescription: "rotki decodes the reward claims you make from Paladin Quest veCRV bribe markets. You choose which Ethereum RPC endpoint handles the queries."
keywords: "paladin portfolio tracker, paladin quest, vecrv bribes, paladin rewards"
features:
  - "Paladin Quest veCRV bribe reward claims decoded as income events, labelled with the bribe period."
setup:
  - "In rotki, add your Ethereum address."
  - "Open History and let the initial sync run. Paladin Quest claims are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Paladin activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
