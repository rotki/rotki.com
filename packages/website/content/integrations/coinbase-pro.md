---
slug: coinbase-pro
label: "Coinbase Pro"
type: exchange
image: "/img/integrations/coinbasepro.svg"
tagline: "Coinbase Pro recognised as a historical location"
intro: "Coinbase Pro was retired by Coinbase in late 2022. rotki keeps it as a historical location, so trades and transfers you bring in through rotki's generic CSV import, or from a CoinLedger or Blockpit export, stay grouped as Coinbase Pro activity in your portfolio history and tax reports."
metaDescription: "Coinbase Pro was retired by Coinbase in late 2022. rotki keeps it as a historical location for trades imported through its generic CSV import."
keywords: "coinbase pro portfolio tracker, coinbase pro tax report, coinbase pro historical data, coinbase pro csv"
features:
  - "Coinbase Pro is preserved as a historical location. Events you import through rotki's generic CSV (generic trades or generic events) or add manually can be tagged as Coinbase Pro."
  - "CoinLedger and Blockpit exports that list Coinbase Pro (or GDAX) as the platform are imported under the Coinbase Pro location."
  - "Historical Coinbase Pro activity feeds into the same cost basis and tax report as the rest of your portfolio."
limitations:
  - "There is no Coinbase Pro API connector; Coinbase shut the exchange down. For trades after the shutdown, use the Coinbase integration with Advanced Trade."
  - "There is no dedicated Coinbase Pro option in rotki's Import Data screen. Reformat the Coinbase Pro statement into rotki's generic CSV import, or add the events manually."
setup:
  - "Find your Coinbase Pro account statement in the Coinbase reports archive, or use a copy you saved before the shutdown."
  - "Reformat it into rotki's generic CSV import (generic trades or generic events) with Coinbase Pro as the location."
  - "In rotki, open Import Data and select the rotki generic trades or generic events importer."
faq:
  - q: "Is Coinbase Pro still active?"
    a: "No. Coinbase retired Coinbase Pro in late 2022 and merged trading into Coinbase Advanced Trade. rotki supports it for historical accounting only."
  - q: "Can I import the Coinbase Pro CSV export directly?"
    a: "Not from the app. Reformat it into rotki's generic CSV import with Coinbase Pro as the location. If you tracked Coinbase Pro in CoinLedger or Blockpit, importing that tool's export also keeps the Coinbase Pro location."
  - q: "Should I use the Coinbase integration instead?"
    a: "For activity after the shutdown, yes. Use the Coinbase integration for current trades and keep your historical Coinbase Pro data in this separate entry."
  - q: "Where is my Coinbase Pro data processed?"
    a: "Entirely on your computer. CSV imports never leave your machine."
screenshots: []
ctaPlan: free
---
