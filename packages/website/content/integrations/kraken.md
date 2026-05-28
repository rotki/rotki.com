---
slug: kraken
label: "Kraken"
type: exchange
image: "/img/integrations/kraken.svg"
tagline: "Kraken trades, ledger, staking, and balances, locally signed"
intro: "Connect Kraken to rotki to import spot trades, ledger entries, staking rewards, margin events, and balances. rotki uses a read-only API key signed from your machine."
keywords: "kraken portfolio tracker, kraken tax report, kraken cost basis, kraken staking tracker, kraken futures tracker"
features:
  - "Spot trades imported as swap events, including instant-buy and convert orders."
  - "Ledger entries (deposits, withdrawals, fees, and transfers) imported as asset movements and events."
  - "Staking rewards imported, including ETH2 and Kraken's staked-asset products."
  - "Margin events (margin, rollover, and settlement ledger entries) recognised."
  - "Kraken Futures balances queried via a separate Futures API key."
  - "KFEE valued at $0.01 when used to pay trading fees."
limitations:
  - "Some Kraken ledger entry types are recognised as informational events rather than fully accounted."
  - "Kraken Futures history is not imported; only futures balances are queried."
  - "rotki has no Kraken-specific CSV importer. To backfill older history without the API, format it into rotki's own generic CSV import (generic trades or generic events)."
  - "Kraken's API rate limits depend on your account tier (Starter / Intermediate / Pro); higher tiers retrieve history faster."
setup:
  - "In Kraken Pro, open Settings → API and click \"Create API key\"."
  - "Under permissions, enable only \"Query Funds\" and \"Query Ledger Entries\". Leave trading and withdrawal permissions off."
  - "Save the key and copy the API key and private key."
  - "In rotki, open API Keys → Exchanges → Add Kraken, paste the key and secret, and pick your account tier."
  - "Optional: to track Kraken Futures balances, generate a separate Futures API key from futures.kraken.com and add it under the same exchange entry."
faq:
  - q: "Does rotki support Kraken Futures?"
    a: "rotki can query your Kraken Futures balances. Generate a separate Futures API key at futures.kraken.com and add it alongside your spot key. Futures trade history is not imported."
  - q: "Will rotki ever be able to trade or withdraw from my Kraken account?"
    a: "No. rotki only asks for the \"Query Funds\" and \"Query Ledger Entries\" permissions. Even if you grant more, rotki never sends trade or withdrawal calls."
  - q: "Where are my Kraken API keys sent?"
    a: "rotki is a local application: your Kraken API key is stored on your computer and used to sign each request, which goes directly from your machine to Kraken's API. No rotki-operated server ever sees the key or the request."
  - q: "Can I import Kraken CSV exports instead of using an API key?"
    a: "rotki does not have a Kraken-specific CSV importer. Connect a read-only API key, or backfill older history using rotki's own generic CSV import (the generic trades and generic events formats)."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
