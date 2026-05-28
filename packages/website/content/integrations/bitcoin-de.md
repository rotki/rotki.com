---
slug: bitcoin-de
label: "Bitcoin.de"
type: exchange
image: "/img/integrations/btcde.svg"
tagline: "Bitcoin.de portfolio tracker - German P2P exchange, local data"
intro: "Connect Bitcoin.de, Germany's peer-to-peer Bitcoin marketplace, to rotki to import your trades and account history with a read-only API key."
keywords: "bitcoin.de portfolio tracker, bitcoin.de tax report, bitcoin.de cost basis, deutschland crypto accounting"
features:
  - "Bitcoin.de marketplace trades imported as swap events."
  - "Balance reconciliation against your Bitcoin.de account."
setup:
  - "In Bitcoin.de, open API → Create API Key."
  - "Set permissions to read-only (account, trades). Disable trade-creation and withdrawal permissions."
  - "In rotki, open API Keys → Exchanges → Add Bitcoin.de and paste the key and secret."
faq:
  - q: "Where are my Bitcoin.de API keys sent?"
    a: "rotki is a local application: your Bitcoin.de API key is stored on your computer and used to sign each request, which goes directly from your machine to Bitcoin.de's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on Bitcoin.de?"
    a: "No. rotki only requests read scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
