---
slug: hop-protocol
label: "Hop Protocol"
type: protocol
image: "/img/integrations/hop_protocol.png"
tagline: "Hop bridge, AMM, liquidity, staking, and HOP rewards, decoded"
intro: "rotki decodes the full Hop Protocol lifecycle across Ethereum and the L2s Hop runs on: bridge sends and receives (with bridge fees split out), AMM swaps via Hop pools, liquidity adds/removes, staking and unstaking of LP positions, ongoing HOP reward claims, and Merkle HOP airdrop claims."
metaDescription: "rotki decodes the full Hop Protocol lifecycle across Ethereum and the L2s Hop runs on: bridge sends and receives (with bridge fees split out), AMM swaps via"
keywords: "hop protocol bridge tracker, hop l2 bridge, hop lp tracker, hop staking, hop airdrop"
features:
  - "Bridge sends are tagged as bridge deposits, with the bonder/relayer fee split out as a separate fee-subtype event so the bridged amount stays clean."
  - "Bridge receives on the destination chain (including L1→L2 transfers and bonded withdrawals) are tagged as bridge withdrawals against the Hop counterparty."
  - "Hop AMM swaps between the canonical asset and its hToken are decoded as trade events."
  - "Add-liquidity and remove-liquidity calls against Hop pools are decoded, with the LP token cached so the pool position is recognised."
  - "Staking, unstaking, and ongoing reward claims from Hop reward contracts are decoded; reward-paid receives are tagged as reward-subtype events."
  - "Merkle HOP airdrop claims are decoded as reward-subtype receives against the Hop counterparty."
  - "Decoded on every chain Hop currently runs on: Ethereum, Arbitrum One, Optimism, Polygon PoS, Base, and Gnosis Chain."
setup:
  - "In rotki, add the addresses you use with Hop on the relevant chains so both sides of each bridge transfer are captured."
  - "In rotki, open History and let the initial sync run. Bridges, AMM swaps, LP adds/removes, staking, reward claims, and HOP airdrop claims are decoded automatically."
faq:
  - q: "Will a Hop bridge transfer create a fake gain or loss?"
    a: "No. Both legs are tagged as bridge events (with the relayer fee split out), which rotki treats as non-taxable transfers rather than a spend/receive pair."
  - q: "Are Hop LP and reward claims captured?"
    a: "Yes. Liquidity adds/removes, stake/unstake events, ongoing reward claims, and the Merkle HOP airdrop are all decoded against the Hop counterparty."
  - q: "Does rotki read Hop activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
