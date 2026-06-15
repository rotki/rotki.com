---
slug: monerium
label: "Monerium"
type: protocol
image: "/img/integrations/monerium.svg"
tagline: "Monerium regulated e-money (EURe, GBPe), decoded locally"
intro: "rotki decodes the mints and burns of Monerium's regulated e-money tokens (EURe, GBPe, USDe, ISKe) on the chains where you hold them, and tracks their balances. Connecting your Monerium account enriches those events with bank-transfer, bridge, memo, and IBAN details and is a Basic (or higher) feature. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes the mints and burns of Monerium's regulated e-money tokens (EURe, GBPe, USDe, ISKe) on the chains where you hold them, and tracks their balances."
keywords: "monerium portfolio tracker, eure tracker, gbpe tracker, regulated stablecoin tracker, sepa stablecoin"
features:
  - "Monerium mints (issuance) and burns (redemption) of EURe, GBPe, USDe, and ISKe decoded as protocol events on the free tier."
  - "Monerium token balances tracked like any other token."
  - "Decoded on Ethereum, Gnosis, Polygon, Arbitrum, Base, and Scroll."
  - "With a Basic subscription: connect your Monerium account to match your orders and enrich events with issue/redeem/bridge labels, the counterpart IBAN, and the order memo."
setup:
  - "In rotki, add your address under a chain where you hold Monerium tokens (Ethereum, Gnosis, Polygon, Arbitrum, Base, or Scroll). Mints and burns are decoded automatically."
  - "Optional (Basic or higher): connect your Monerium account so rotki can match orders and enrich the on-chain events."
  - "Open History and let the initial sync run."
faq:
  - q: "Which RPC does rotki use for Monerium activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "What works on the free tier and what needs a subscription?"
    a: "Decoding Monerium mints and burns and tracking your token balances work on the free tier. Connecting your Monerium account to match orders and enrich events with bank-transfer, bridge, memo, and IBAN details requires a Basic (or higher) subscription."
screenshots: []
ctaPlan: basic
---
