---
slug: pump-fun
label: "Pump.fun"
type: protocol
image: "/img/integrations/pump-fun.png"
tagline: "Pump.fun trades and fees on Solana, decoded locally"
intro: "rotki decodes your Pump.fun buys and sells on Solana as trade events and recognises the Pump.fun protocol and coin-creator fees, so your memecoin activity has a clear cost basis. You choose which Solana RPC endpoint handles the queries."
keywords: "pump.fun portfolio tracker, solana memecoin tracker, pumpfun trade history, solana defi tax"
features:
  - "Pump.fun buys and sells decoded as trade events on Solana."
  - "Pump.fun protocol fee and coin-creator fee recognised as fee events."
setup:
  - "In rotki, add your Solana address. Pump.fun activity is decoded automatically."
  - "Open History and let the initial sync run."
faq:
  - q: "Which Solana RPC does rotki use for Pump.fun activity?"
    a: "rotki is a local application that talks directly to the Solana RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
