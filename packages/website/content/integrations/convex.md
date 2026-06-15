---
slug: convex
label: "Convex"
type: protocol
image: "/img/integrations/convex.jpeg"
tagline: "Curve LP boosting, vlCVX, and rewards decoded"
intro: "rotki decodes your Convex Finance activity on Ethereum: Curve LP deposits and withdrawals, vlCVX locks and unlocks, and CRV/CVX/extra reward claims."
metaDescription: "rotki decodes your Convex Finance activity on Ethereum: Curve LP deposits and withdrawals, vlCVX locks and unlocks, and CRV/CVX/extra reward claims."
keywords: "convex portfolio tracker, cvx tracker, vlcvx tracker, convex curve boost, convex rewards"
features:
  - "Convex deposits and withdrawals of Curve LP tokens against the matching Convex pool."
  - "vlCVX locks and unlocks decoded, with relocked withdrawals distinguished from genuine unlocks."
  - "CRV, CVX, and pool reward claims tagged as reward subtype events against the Convex counterparty."
  - "Virtual-rewards contracts (extra incentive rewards distributed alongside CRV/CVX) recognised."
  - "Convex balances (staked LPs, staked CVX, locked CVX) queried on demand and included in your portfolio."
limitations:
  - "Convex decoding is currently Ethereum-only; there is no per-chain Convex module."
setup:
  - "In rotki, add the Ethereum address you use with Convex."
  - "In rotki, open History and let the initial sync run. Deposits, withdrawals, locks, unlocks, and reward claims are decoded automatically."
faq:
  - q: "Are CRV and CVX rewards tracked?"
    a: "Yes. Pool reward claims are tagged as reward events against the Convex counterparty, including extra rewards distributed via the virtual-rewards contracts."
  - q: "Is vlCVX tracked?"
    a: "Yes. Vote-locked CVX deposits and unlocks are decoded; relocked withdrawals are not mistaken for an unlock."
  - q: "Does rotki read Convex positions from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
