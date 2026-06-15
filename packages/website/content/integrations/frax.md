---
slug: frax
label: "Frax"
type: protocol
image: "/img/integrations/frax.png"
tagline: "FPIS airdrop claim, decoded"
intro: "rotki tags the FPIS (Frax Price Index Share) airdrop claim against the Frax counterparty on Ethereum so the claim shows up as a Frax-attributed receive in your history."
metaDescription: "rotki tags the FPIS (Frax Price Index Share) airdrop claim against the Frax counterparty on Ethereum so the claim shows up as a Frax-attributed receive in your"
keywords: "frax portfolio tracker, fpis airdrop, frax airdrop claim"
features:
  - "FPIS airdrop claim is decoded as an airdrop receive event tagged against the Frax counterparty."
limitations:
  - "Frax-specific decoding is currently limited to the FPIS airdrop claim. sFRAX, frxETH and sfrxETH liquid staking, veFXS locking, and Frax gauge rewards are not decoded as Frax-counterparty events; the underlying token movements still appear in your history."
  - "FRAX and other Frax-issued tokens are tracked as ordinary ERC-20s on whatever chain they appear, but rotki has no Frax-aware decoder for their stablecoin minting/redemption flows."
setup:
  - "In rotki, add the Ethereum address that claimed FPIS."
  - "In rotki, open History and let the initial sync run. The FPIS airdrop claim is decoded automatically; other Frax-related token movements appear as ordinary ERC-20 events."
faq:
  - q: "Are sFRAX, frxETH, sfrxETH, and veFXS decoded as Frax events?"
    a: "Not currently. Their token movements (deposits, withdrawals, transfers) show up as ordinary ERC-20 events without a Frax counterparty tag."
  - q: "Does rotki read Frax activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
