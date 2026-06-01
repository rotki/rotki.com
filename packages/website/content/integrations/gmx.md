---
slug: gmx
label: "GMX"
type: protocol
image: "/img/integrations/gmx.svg"
tagline: "GMX v1 swaps, perp positions, and staking on Arbitrum, decoded"
intro: "rotki decodes GMX v1 activity on Arbitrum One: swaps through the GMX vault, long/short position increases and decreases (with the GMX execution fee captured separately), GMX staking, and the staked GMX + GLP + esGMX balances that follow from it."
keywords: "gmx portfolio tracker, gmx perps tracker, glp tracker, gmx staking, esgmx tracker"
features:
  - "GMX vault swaps decoded as trade events (spend/receive) tagged against the GMX counterparty."
  - "Long and short position increases and decreases decoded with the direction, asset, and collateral amount in the notes."
  - "GMX execution fees on position changes are split out as a separate ETH spend tagged against GMX, so the fee doesn't get folded into the position size."
  - "GMX staking: the GMX spend is tagged as a staking deposit and the bookkeeping receive (sGMX/sbGMX/sbfGMX) as a receive-wrapped event, both against the GMX counterparty."
  - "Staked GMX balances are queried on demand; staked GLP (fsGLP), sbGMX, and esGMX (non-transferable) are recognised as tokens and surface in the portfolio."
limitations:
  - "GMX decoding currently covers GMX v1 on Arbitrum One only. GMX v2 (GM tokens, the new market system) and GMX on Avalanche are not yet decoded."
setup:
  - "In rotki, add the Arbitrum One address you use with GMX."
  - "In rotki, open History and let the initial sync run. Swaps, position changes, execution fees, and staking events are decoded automatically; staked balances are queried on demand."
faq:
  - q: "Is GMX v2 supported?"
    a: "Not currently. The GMX decoder covers GMX v1 (vault swaps, perp positions, GMX/GLP staking) on Arbitrum One. GMX v2 GM tokens and markets are not yet decoded as GMX-counterparty events."
  - q: "Does rotki read GMX activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Arbitrum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
