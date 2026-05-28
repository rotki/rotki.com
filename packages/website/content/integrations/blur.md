---
slug: blur
label: "Blur"
type: protocol
image: "/img/integrations/blur.png"
tagline: "Track BLUR staking and airdrop claims"
intro: "rotki decodes Blur staking and airdrop claims on Ethereum, and reports your staked BLUR balance alongside the rest of your portfolio."
keywords: "blur portfolio tracker, blur staking, blur airdrop"
features:
  - "Stake and unstake of BLUR in the Blur staking contract decoded as staking events."
  - "BLUR airdrop claims (airdrop 2 distributor) decoded as airdrop receive events."
  - "Staked BLUR balance queried on demand and included in your portfolio."
limitations:
  - "Marketplace activity (sales, listings, bids) and Blend NFT loans are not currently decoded as Blur-counterparty events."
setup:
  - "In rotki, add the Ethereum address that holds your BLUR or interacts with the Blur staking contract."
  - "In rotki, open History and let the initial sync run. Staking and airdrop events are decoded automatically."
faq:
  - q: "Does rotki read Blur activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Was the BLUR airdrop captured?"
    a: "Yes. Claims from the Blur airdrop 2 distributor are decoded as airdrop receive events."
screenshots: []
ctaPlan: free
---
