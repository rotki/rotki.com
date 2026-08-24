---
slug: yearn
label: "Yearn"
type: protocol
image: "/img/integrations/yearn_vaults.svg"
tagline: "Yearn v2 and v3 vaults, decoded locally"
intro: "rotki decodes Yearn vault deposits and withdrawals (v2 and v3), staking transactions, and reward claims across several EVM chains. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes Yearn vault deposits and withdrawals (v2 and v3), staking transactions, and reward claims across several EVM chains."
keywords: "yearn portfolio tracker, yearn vault tracker, yvault, yearn defi tax, yearn v3 tracker"
features:
  - "Yearn v2 and v3 vault deposits and withdrawals decoded."
  - "Yearn staking deposits, withdrawals, and reward claims decoded."
  - "Vault positions reflected in your portfolio."
  - "Yearn vesting escrows on Ethereum decoded: escrow creation, claims from a vesting escrow, and revocations, across all four escrow factory versions."
  - "Tokens still owed to you by a vesting escrow are queried and counted in your balances, so an unvested grant is not invisible until it is claimed."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, and Gnosis."
setup:
  - "In rotki, add your address under a chain where you've used Yearn. Vault positions are detected automatically."
  - "Optional: refresh Yearn data under Settings → Manage Data → Refresh protocol data."
  - "Open History and let the initial sync run. Yearn events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Yearn activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Which chains are supported?"
    a: "Yearn is decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, and Gnosis."
  - q: "Are Yearn staking rewards captured?"
    a: "Yes. Staking deposits, withdrawals, and reward claims are all decoded."
  - q: "What about tokens locked in a Yearn vesting escrow?"
    a: "rotki decodes the escrow being created, each claim you make from it, and a revocation if one happens. It also reads the amount the escrow still owes you, so unvested tokens show up in your balances rather than appearing only once claimed."
screenshots: []
ctaPlan: free
---
