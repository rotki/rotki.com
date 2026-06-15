---
slug: polygon
label: "Polygon Bridge"
type: protocol
image: "/img/integrations/polygon_pos.svg"
tagline: "Polygon PoS bridge and MATIC-to-POL migration, decoded locally"
intro: "rotki decodes Polygon PoS bridge deposits and withdrawals between Ethereum and Polygon, and the MATIC-to-POL token migration. Source and destination legs are linked so bridged assets are not double-counted. For Polygon PoS chain balances see the [Polygon PoS](/integrations/polygon-pos) integration. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes Polygon PoS bridge deposits and withdrawals between Ethereum and Polygon, and the MATIC-to-POL token migration."
keywords: "polygon bridge tracker, polygon pos bridge, ethereum to polygon transfer, matic to pol migration"
features:
  - "Polygon PoS bridge deposits and withdrawals decoded as protocol events, including the Exit NFT used to complete a withdrawal."
  - "Source-chain (Ethereum) and destination-chain (Polygon) legs linked to avoid double-counting."
  - "MATIC-to-POL token migration decoded."
setup:
  - "In rotki, add your address on both Ethereum and Polygon PoS."
  - "Open History and let the initial sync run. Bridge and migration events are decoded automatically."
faq:
  - q: "How is this different from the Polygon PoS integration?"
    a: "The Polygon PoS integration tracks balances and activity on the Polygon chain itself. This page covers the Ethereum-side Polygon mechanisms: the PoS bridge transfers and the MATIC-to-POL migration."
  - q: "Which RPC does rotki use for these events?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
