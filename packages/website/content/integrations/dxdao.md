---
slug: dxdao
label: "DXdao"
type: protocol
image: "/img/integrations/dxdao.svg"
tagline: "DXdao Mesa exchange (Gnosis Protocol v1) activity, decoded"
intro: "rotki decodes interactions with the DXdao Mesa exchange contract on Ethereum: deposits, withdrawals, withdraw requests, and order placements from the batch-auction era."
metaDescription: "rotki decodes interactions with the DXdao Mesa exchange contract on Ethereum: deposits, withdrawals, withdraw requests, and order placements from the"
keywords: "DXdao historical records, DXdao Mesa, Gnosis Protocol v1, DXdao exchange"
features:
  - "Deposits into the DXdao Mesa exchange contract tagged as deposit-to-protocol events against the DXdao counterparty."
  - "Withdrawals from the DXdao Mesa exchange contract tagged as withdraw-from-protocol events."
  - "Withdraw-request events (the two-step Mesa withdrawal flow) recorded as informational DXdao events with the requested asset and amount."
  - "Order placements on Mesa recorded as informational events showing the sell amount, buy amount, and tokens."
limitations:
  - "Only DXdao Mesa exchange contract activity is decoded. DXD redemptions, the DXdao Reputation token, and other DXdao products are not covered by a DXdao-specific decoder."
setup:
  - "In rotki, add the Ethereum address you used with the DXdao Mesa exchange."
  - "In rotki, open History and let the initial sync run. Mesa deposits, withdrawals, withdraw requests, and order placements are decoded automatically."
faq:
  - q: "Is DXdao still active?"
    a: "DXdao voted to dissolve in 2024. rotki's DXdao decoder covers historical Mesa exchange activity rather than the dissolution itself."
  - q: "Are DXD redemptions decoded?"
    a: "Not as DXdao-specific events. The DXdao decoder is scoped to the Mesa exchange contract."
  - q: "Does rotki read DXdao activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
