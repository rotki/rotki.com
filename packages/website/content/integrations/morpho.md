---
slug: morpho
label: "Morpho"
type: protocol
image: "/img/integrations/morpho.svg"
tagline: "Morpho Blue, vaults, and Merkl rewards, decoded locally"
intro: "rotki decodes Morpho Blue lending positions, Morpho vault (MetaMorpho) positions, and Merkl-distributed Morpho rewards. Bundled Morpho transactions that perform several actions in one call are unpacked into separate events."
keywords: "morpho portfolio tracker, morpho blue tracker, morpho vault tracker, morpho merkl rewards, morpho defi tax"
features:
  - "Morpho Blue deposits, withdrawals, and borrow liabilities decoded."
  - "Morpho vault (MetaMorpho) positions tracked, with vault tokens resolved to their underlying assets."
  - "Bundled transactions that perform multiple actions in one call are decoded as separate events."
  - "Morpho rewards distributed via Merkl decoded as income events."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, BNB Smart Chain, Scroll, Hyperliquid, and Monad."
setup:
  - "In rotki, add your address under a chain where your Morpho position lives. Positions are detected automatically."
  - "Open History and let the initial sync run. Morpho events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Morpho activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Does rotki support both Morpho Blue and Morpho vaults?"
    a: "Yes. Morpho Blue lending positions and Morpho vault (MetaMorpho) positions are both tracked, including Merkl rewards routed to either."
  - q: "Are bundled Morpho transactions decoded?"
    a: "Yes. Transactions that perform multiple actions in one call are unpacked into their individual events."
screenshots: []
ctaPlan: free
---
