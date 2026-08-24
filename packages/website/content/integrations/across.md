---
slug: across
label: "Across"
type: protocol
image: "/img/integrations/across.svg"
tagline: "Across bridge transfers and LP positions, decoded"
intro: "rotki decodes Across bridge deposits and fills across the EVM chains it supports, matches the two legs of a bridge transfer into one movement, and values your Across liquidity pool and staked LP positions."
metaDescription: "rotki decodes Across bridge deposits and fills, matches both legs of a transfer, and values your Across LP and staked LP positions."
keywords: "Across bridge tracker, Across portfolio tracker, Across accounting, Across tax, Across LP"
features:
  - "Bridge deposits and fills decoded on Ethereum, Arbitrum One, Optimism, Base, Polygon PoS, BNB Smart Chain, Hyperliquid, and Monad."
  - "The outgoing deposit and the incoming fill are matched into a single bridge transfer when both chains are tracked, instead of two unrelated events."
  - "Across liquidity pool events on Ethereum: liquidity added, liquidity removed, LP tokens staked and unstaked."
  - "Balances for your Across LP tokens and for LP tokens staked in the Across staking contract, priced through their underlying assets."
limitations:
  - "Both sides of a bridge transfer are only matched when you track an address on both chains. If the destination chain is not added in rotki, only the deposit leg appears."
  - "Across is a cross-chain bridge, not a chain rotki tracks on its own. You still need to add the relevant addresses under Blockchain Balances for the chains you bridge between."
setup:
  - "In rotki, open Blockchain Balances and add the addresses you bridge from and to."
  - "Open History and let the transaction sync run. Across deposits, fills, and LP events are decoded automatically."
  - "Open Balances → Blockchain to see LP and staked LP positions alongside the rest of your portfolio."
faq:
  - q: "Why does my bridge transfer show up twice?"
    a: "It should not, once both addresses are tracked. rotki matches the deposit on the source chain with the fill on the destination chain into one bridge transfer. If only one side is tracked, only that leg exists to show."
  - q: "Are Across LP rewards tracked?"
    a: "Staked LP balances are queried from the Across staking contract, so the position is valued. Reward claims appear as decoded events on the address that claimed them."
  - q: "Does rotki send my addresses anywhere?"
    a: "No. rotki runs locally and queries the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
