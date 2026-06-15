---
slug: sky
label: "Sky"
type: protocol
image: "/img/integrations/sky_money.svg"
tagline: "Sky USDS, sUSDS, PSM, and migrations, decoded locally"
intro: "rotki decodes activity on Sky (the rebrand of MakerDAO): Sky PSM direct swaps and the migrations from MKR and DAI, and tracks your USDS and sUSDS balances. You choose which Ethereum RPC endpoint handles the queries."
metaDescription: "rotki decodes activity on Sky (the rebrand of MakerDAO): Sky PSM direct swaps and the migrations from MKR and DAI, and tracks your USDS and sUSDS balances."
keywords: "sky money tracker, usds tracker, susds savings tracker, sky psm tracker, makerdao sky rebrand"
features:
  - "USDS and sUSDS tracked as token balances alongside the rest of your portfolio."
  - "Sky PSM direct swaps decoded as swap events."
  - "DAI-to-USDS and MKR-to-SKY migration events decoded."
  - "Works alongside the MakerDAO integration, which continues to decode the legacy MakerDAO contracts."
setup:
  - "In rotki, add your Ethereum address. Sky balances and transactions are detected automatically."
  - "Open History and let the initial sync run. Sky events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Sky activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Is Sky the same protocol as MakerDAO?"
    a: "Sky is the rebrand of MakerDAO. rotki decodes both the legacy MakerDAO contracts and the new Sky contracts, including the migration between them."
  - q: "Are my sUSDS savings tracked?"
    a: "Yes. Your sUSDS balance is tracked and appears in your portfolio."
screenshots: []
ctaPlan: free
---
