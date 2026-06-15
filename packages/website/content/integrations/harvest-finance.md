---
slug: harvest-finance
label: "Harvest Finance"
type: protocol
image: "/img/integrations/harvest.svg"
tagline: "GRAIN hack-compensation airdrop claim, decoded"
intro: "rotki decodes the GRAIN airdrop on Ethereum (the post-incident compensation distribution from the October 2020 Harvest exploit) as an airdrop receive against the Harvest Finance counterparty."
metaDescription: "rotki decodes the GRAIN airdrop on Ethereum (the post-incident compensation distribution from the October 2020 Harvest exploit) as an airdrop receive against"
keywords: "harvest finance, grain airdrop, harvest hack compensation, farm token"
features:
  - "GRAIN airdrop claims from the Harvest Merkle distributor are tagged as airdrop-subtype receives against the Harvest Finance counterparty."
limitations:
  - "Harvest Finance-specific decoding is limited to the GRAIN compensation airdrop claim. Vault deposits/withdrawals and FARM/iFARM reward claims are not decoded as Harvest-counterparty events; their token movements appear as ordinary ERC-20 events."
setup:
  - "In rotki, add the Ethereum address that claimed GRAIN from the Harvest compensation distributor."
  - "In rotki, open History and let the initial sync run. The GRAIN airdrop claim is decoded automatically."
faq:
  - q: "Are Harvest vault deposits and FARM rewards decoded?"
    a: "Not currently. Only the GRAIN compensation airdrop is tagged against the Harvest Finance counterparty; vault and reward token movements appear as ordinary ERC-20 events."
  - q: "Does rotki read Harvest activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
