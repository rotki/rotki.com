---
slug: project-x
label: "Project X"
type: protocol
image: "/img/integrations/project-x.svg"
tagline: "Project X swaps and concentrated liquidity on Hyperliquid"
intro: "rotki decodes Project X activity on Hyperliquid: swaps through its router, and concentrated liquidity positions - liquidity added, liquidity removed, and fees collected on your position NFTs."
metaDescription: "rotki decodes Project X swaps and concentrated liquidity events on Hyperliquid, including fees collected on position NFTs."
keywords: "Project X portfolio tracker, Hyperliquid DEX tracker, Project X liquidity, Project X accounting, Project X tax"
features:
  - "Swaps through the Project X router decoded as paired spend/receive trades."
  - "Concentrated liquidity positions decoded from the Project X NFT manager: increases, decreases, and collections against a specific position id."
  - "Fee collections separated from liquidity withdrawals, so earned fees are recorded as income rather than as a return of your own capital."
  - "Position tokens and amounts resolved from the position NFT when they cannot be inferred from the transfers in the transaction."
limitations:
  - "Project X is tracked on Hyperliquid (HyperEVM). You need a Hyperliquid address added in rotki for its activity to be decoded."
  - "The value of an open concentrated liquidity position is not queried as a Project X protocol balance; the events on the position are decoded, but the live position is not priced as a separate balance entry."
setup:
  - "In rotki, open Blockchain Balances → Hyperliquid → Add address."
  - "Open History and let the transaction sync run. Project X swaps and liquidity events are decoded automatically."
faq:
  - q: "Are the fees I collect treated as income?"
    a: "Yes. rotki separates a fee collection from a liquidity withdrawal, so collected fees are recorded as earned rather than as your own principal coming back."
  - q: "Why does a liquidity event reference a number?"
    a: "That is the position id of the Project X NFT the event belongs to. Concentrated liquidity positions are NFTs, so each event is tied to the position it changed."
  - q: "Where do the Hyperliquid queries go?"
    a: "rotki runs locally and talks directly to the Hyperliquid RPC endpoint you configure - the public default, a third-party provider, or your own node. Nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
