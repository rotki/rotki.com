---
slug: juicebox
label: "Juicebox"
type: protocol
image: "/img/integrations/juicebox.svg"
tagline: "Juicebox project payments on Ethereum, decoded locally"
intro: "rotki decodes the payments you make to Juicebox projects on Ethereum and recognises the reward NFT you receive in return. Processing is local; you choose which Ethereum RPC endpoint handles the queries."
keywords: "juicebox portfolio tracker, juicebox treasury, juicebox payments, dao funding tracker"
features:
  - "Payments to Juicebox projects decoded as outgoing ETH events with the Juicebox counterparty."
  - "Reward NFTs received for paying a Juicebox project recognised."
limitations:
  - "Only payments and their reward NFTs are decoded; redemptions and reserved-token distributions are not yet covered."
setup:
  - "In rotki, add your Ethereum address."
  - "Open History and let the initial sync run. Juicebox payments are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Juicebox activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
