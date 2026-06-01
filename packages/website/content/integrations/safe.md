---
slug: safe
label: "Safe (Gnosis Safe)"
type: protocol
image: "/img/integrations/safemultisig.svg"
tagline: "Safe multisig tracking, read-only and local"
intro: "Track Safe multisig accounts in rotki: balances, transactions, decoded DeFi activity, and multisig management events for treasuries, DAOs, and personal multisigs. You choose which RPC endpoint handles the queries."
keywords: "safe multisig tracker, gnosis safe tracker, treasury tracker, dao multisig accounting"
features:
  - "Add any Safe address as a read-only watch address - no Safe owner keys needed."
  - "Multisig management events decoded: Safe creation, owner additions and removals, threshold changes, master-copy upgrades, and execution success/failure."
  - "DeFi decoders run on Safe-routed transactions, so protocols like Aave, Curve, and Uniswap are decoded when the transaction goes through a Safe."
  - "Works across the EVM chains where Safe is deployed (Ethereum, Arbitrum, Optimism, Polygon, Base, Gnosis, Scroll, BNB Smart Chain, and more)."
setup:
  - "In rotki, add your Safe address as a tracked address on the chain where it is deployed."
  - "Open History and let the initial sync run. Safe transactions and decoded DeFi events appear automatically."
faq:
  - q: "Does rotki need Safe owner signatures or keys?"
    a: "No. Safe addresses are tracked as read-only watch addresses. rotki never asks for owner keys or signatures."
  - q: "Are DeFi events done via a Safe decoded?"
    a: "Yes. Protocols like Aave, Curve, and Uniswap are decoded when the transaction is routed through a Safe."
  - q: "Which RPC does rotki use for Safe activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
