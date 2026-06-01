---
slug: shutter
label: "Shutter"
type: protocol
image: "/img/integrations/shutter.png"
tagline: "Shutter SHU airdrop and delegation, decoded locally"
intro: "rotki decodes Shutter Network SHU airdrop claims into the vesting contract, vested SHU redemptions, and SHU delegation changes. You choose which Ethereum RPC endpoint handles the queries."
keywords: "shutter portfolio tracker, shu airdrop, shutter network, shu vesting"
features:
  - "SHU airdrop claims into the vesting contract decoded as airdrop income."
  - "Redemptions of vested SHU decoded."
  - "SHU delegation changes decoded."
setup:
  - "In rotki, add your Ethereum address."
  - "Open History and let the initial sync run. Shutter events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Shutter activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
