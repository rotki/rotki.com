---
slug: clipper
label: "Clipper"
type: protocol
image: "/img/integrations/clipper.svg"
tagline: "Clipper swaps decoded on five EVM chains"
intro: "rotki turns your Clipper DEX activity into readable swap events, tagged with Clipper as the counterparty, on Ethereum, Arbitrum One, Optimism, Base, and Polygon PoS."
metaDescription: "rotki decodes your Clipper DEX swaps into readable, counterparty-tagged events on Ethereum, Arbitrum One, Optimism, Base, and Polygon PoS."
keywords: "Clipper portfolio tracker, Clipper DEX accounting, Clipper tax, Clipper integration"
features:
  - "Clipper swaps decoded on Ethereum, Arbitrum One, Optimism, Base, and Polygon PoS."
  - "Each swap becomes a paired spend/receive event tagged with Clipper, so it is priced and reported as a trade rather than two loose transfers."
  - "Swap events feed straight into the profit and loss report with the rest of your on-chain history."
limitations:
  - "Only swaps through Clipper's pools are decoded. Providing liquidity to Clipper is not decoded as a Clipper-counterparty event and no Clipper LP balance is queried."
setup:
  - "In rotki, open Blockchain Balances and add the address you use with Clipper on the relevant chain."
  - "Open History and let the transaction sync run. Clipper swaps are decoded automatically."
faq:
  - q: "Which chains does the Clipper integration cover?"
    a: "Ethereum, Arbitrum One, Optimism, Base, and Polygon PoS - the chains where rotki ships a Clipper decoder."
  - q: "Are my Clipper LP deposits tracked?"
    a: "Not as Clipper-counterparty events. Token movements in and out of Clipper's pools still appear as ordinary transfers on the address."
  - q: "Where does rotki get the data?"
    a: "From the chain itself. rotki is a local application that talks directly to the RPC endpoint you configure for each chain, so nothing goes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
