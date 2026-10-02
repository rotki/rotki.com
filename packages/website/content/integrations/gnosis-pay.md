---
slug: gnosis-pay
label: "Gnosis Pay"
type: protocol
image: "/img/integrations/gnosis_pay.png"
tagline: "Gnosis Pay spends, refunds, and cashback, decoded locally"
intro: "rotki decodes your Gnosis Pay activity on Gnosis Chain - card spends, refunds, cashback, and referral rewards - through your Safe. Gnosis Pay is closing its consumer card and web app on December 20, 2026, and your card history stays readable on-chain after that. Connecting your Gnosis Pay account to enrich spends with merchant details is part of the Basic and Advanced plans. You choose which Gnosis RPC endpoint handles the queries."
metaDescription: "rotki decodes your Gnosis Pay card spends, refunds, cashback and rewards on Gnosis Chain, including your history after the card closes on December 20, 2026."
keywords: "gnosis pay tracker, gnosis pay card, gnosis pay cashback, gnosis pay shutdown, gnosis pay transaction history, gnosis pay accounting"
features:
  - "Card spends decoded as payment events on the free tier."
  - "Refunds from Gnosis Pay decoded."
  - "Cashback (paid in GNO) and referral rewards recognised as income."
  - "On Basic and Advanced: connect your Gnosis Pay account to enrich each spend with the merchant name, location, and category. rotki stores those details in your local database."
limitations:
  - "Gnosis Pay closes its consumer card and web app on December 20, 2026. Merchant details come from the Gnosis Pay API, so connect your account before then to keep them for your spends. Decoding from your Safe does not depend on Gnosis Pay and keeps working."
  - "Gnosis Pay ended its GNO cashback program on September 30, 2026. Cashback you already received stays in your history."
setup:
  - "In rotki, add the Gnosis Chain Safe address you use for Gnosis Pay. Spends, refunds, and cashback are decoded automatically."
  - "Optional (Basic and Advanced): connect your Gnosis Pay account so rotki can add merchant details to your spends."
  - "Open History and let the initial sync run."
faq:
  - q: "What happens to my Gnosis Pay history after December 20, 2026?"
    a: "Your spends, refunds, and cashback are transactions on Gnosis Chain, so rotki keeps decoding them from your Safe after the card closes. Merchant names and categories need the Gnosis Pay API; rotki keeps the ones it already fetched in your local database, so connect your account before the shutdown."
  - q: "Are my funds affected by the shutdown?"
    a: "Gnosis Pay says no: funds sit in your self-custodial Safe on Gnosis Chain, and the web app stays available for withdrawals. rotki keeps tracking the Safe's balance either way."
  - q: "Which Gnosis RPC does rotki use for Gnosis Pay activity?"
    a: "rotki is a local application that talks directly to the Gnosis RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "What works on the free tier and what needs a subscription?"
    a: "Decoding your Gnosis Pay spends, refunds, cashback, and referral rewards works on the free tier. Connecting your Gnosis Pay account to enrich spends with merchant name, location, and category requires a Basic or Advanced subscription."
screenshots: []
ctaPlan: basic
---
