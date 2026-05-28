---
slug: compound
label: "Compound"
type: protocol
image: "/img/integrations/compound.svg"
tagline: "Compound v2 and v3 lending, decoded"
intro: "rotki decodes your Compound v2 activity on Ethereum and your Compound v3 (Comet) activity on Ethereum, Arbitrum, Optimism, Base, Polygon PoS, and Scroll: supplies, withdrawals, borrows, repayments, and COMP claims."
keywords: "compound portfolio tracker, compound v3 tracker, comet tracker, compound defi tax, comp rewards tracker"
features:
  - "Compound v2 on Ethereum: cToken mint/redeem and borrow/repay events are decoded against the Compound counterparty."
  - "Compound v3 (Comet) deposits, withdrawals, borrows, and repays decoded across each Comet deployment."
  - "Compound v3 bulker contract decoded so the underlying ETH/WETH movement is captured rather than being attributed to the bulker."
  - "COMP rewards claims (Compound rewards contract) decoded as receive events."
  - "Compound v3 balances queried on demand and included in your portfolio."
limitations:
  - "Compound v2 is only deployed on Ethereum; v2 activity on other chains is not decoded."
setup:
  - "In rotki, add the addresses you use on the chains where your Compound positions live (Ethereum for v2, plus any of Arbitrum, Optimism, Base, Polygon PoS, or Scroll for v3)."
  - "In rotki, open History and let the initial sync run. Compound v2 and v3 events are decoded automatically."
faq:
  - q: "Which chains does Compound v3 cover?"
    a: "Compound v3 (Comet) is decoded on Ethereum, Arbitrum, Optimism, Base, Polygon PoS, and Scroll."
  - q: "Are Compound bulker transactions handled?"
    a: "Yes. Compound v3 bulker calls are decoded so the underlying ETH/WETH movement is recorded against your address rather than the bulker contract."
  - q: "Does rotki read Compound positions from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
