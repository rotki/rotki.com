---
slug: gho
label: "GHO"
type: protocol
image: "/img/integrations/gho.svg"
tagline: "stkGHO staking, cooldown, and unstake events, decoded"
intro: "rotki decodes the GHO safety-module (stkGHO) staking flow on Ethereum: staking GHO, activating the unstaking cooldown, and redeeming stkGHO back to GHO. The paired events are linked into a stake/wrap-and-unstake/unwrap pair against the GHO counterparty."
keywords: "gho portfolio tracker, stkgho tracker, gho staking, aave gho safety module"
features:
  - "Stake GHO: the GHO spend is tagged as a staking deposit and the matching stkGHO receive is tagged as a receive-wrapped event, both against the GHO counterparty."
  - "Cooldown activation: starting the stkGHO unstaking cooldown is recorded as an informational event with the cooldown amount in the notes."
  - "Unstake (redeem) stkGHO: the stkGHO spend is tagged as return-wrapped and the matching GHO receive as a staking-remove-asset event."
limitations:
  - "Only the stkGHO safety-module flow on Ethereum is decoded against the GHO counterparty. GHO borrow/repay flows on Aave are decoded by the Aave integration, not under the GHO counterparty."
setup:
  - "In rotki, add the Ethereum address you use with the GHO safety module."
  - "In rotki, open History and let the initial sync run. Stake, cooldown, and unstake events are decoded automatically and paired."
faq:
  - q: "Are GHO borrow/repay events covered here?"
    a: "No - those are part of Aave's GHO facility and are decoded under the Aave counterparty by rotki's Aave integration."
  - q: "Does rotki read GHO activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
