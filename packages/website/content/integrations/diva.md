---
slug: diva
label: "Diva"
type: protocol
image: "/img/integrations/diva.svg"
tagline: "DIVA airdrop claims, delegation, and governance events, decoded"
intro: "rotki decodes activity around the DIVA governance token on Ethereum: airdrop claims, delegate changes, and votes on the Diva Governor contract."
metaDescription: "rotki decodes activity around the DIVA governance token on Ethereum: airdrop claims, delegate changes, and votes on the Diva Governor contract."
keywords: "diva token tracker, diva airdrop, diva governance, diva delegation"
features:
  - "DIVA airdrop claims (Merkle distributor) decoded as airdrop receive events against the Diva counterparty."
  - "Delegate-changed events on the DIVA token recorded as governance informational events with the old and new delegate noted."
  - "Diva Governor proposals and votes decoded via rotki's generic governance interface, with links to Tally proposal pages."
limitations:
  - "Only DIVA governance-token activity is decoded. The Diva Staking product (liquid staking deposits/withdrawals/rewards) is not covered by a Diva-specific decoder."
setup:
  - "In rotki, add the Ethereum address that held or claimed DIVA."
  - "In rotki, open History and let the initial sync run. Airdrop claims, delegate changes, and governor events are decoded automatically."
faq:
  - q: "Are Diva Staking deposits and rewards decoded?"
    a: "No. Only DIVA governance-token events (airdrop, delegation, governor proposals/votes) are tagged against the Diva counterparty."
  - q: "Does rotki read DIVA activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
