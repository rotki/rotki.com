---
slug: gnosis-pay
label: "Gnosis Pay"
type: protocol
image: "/img/integrations/gnosis_pay.png"
tagline: "Gnosis Pay spends, refunds, and cashback, decoded locally"
intro: "rotki decodes your Gnosis Pay activity on Gnosis Chain - card spends, refunds, cashback, and referral rewards - through your Safe. Connecting your Gnosis Pay account to enrich spends with merchant details is a Basic (or higher) feature. You choose which Gnosis RPC endpoint handles the queries."
metaDescription: "rotki decodes your Gnosis Pay activity on Gnosis Chain - card spends, refunds, cashback, and referral rewards - through your Safe."
keywords: "gnosis pay tracker, gnosis pay card, gnosis pay cashback, gnosis chain card spending, gnosis pay accounting"
features:
  - "Card spends decoded as payment events on the free tier."
  - "Refunds from Gnosis Pay decoded."
  - "Cashback (paid in GNO) and referral rewards recognised as income."
  - "With a Basic subscription: connect your Gnosis Pay account to enrich each spend with the merchant name, location, and category."
setup:
  - "In rotki, add the Gnosis Chain Safe address you use for Gnosis Pay. Spends, refunds, and cashback are decoded automatically."
  - "Optional (Basic or higher): connect your Gnosis Pay account so rotki can add merchant details to your spends."
  - "Open History and let the initial sync run."
faq:
  - q: "Which Gnosis RPC does rotki use for Gnosis Pay activity?"
    a: "rotki is a local application that talks directly to the Gnosis RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "What works on the free tier and what needs a subscription?"
    a: "Decoding your Gnosis Pay spends, refunds, cashback, and referral rewards works on the free tier. Connecting your Gnosis Pay account to enrich spends with merchant name, location, and category requires a Basic (or higher) subscription."
screenshots: []
ctaPlan: basic
---
