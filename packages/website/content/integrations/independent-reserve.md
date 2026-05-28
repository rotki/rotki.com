---
slug: independent-reserve
label: "Independent Reserve"
type: exchange
image: "/img/integrations/independentreserve.svg"
tagline: "Independent Reserve trades, transfers, and balances, locally signed"
intro: "Connect Independent Reserve, Australia's longest-running regulated crypto exchange, to rotki to import trades, deposits, withdrawals, and balances. rotki uses a read-only API key signed from your machine."
keywords: "independent reserve portfolio tracker, independent reserve tax report, australia crypto accounting, new zealand crypto accounting"
features:
  - "Spot trades imported as swap events with matched spend and receive sides."
  - "Deposits and withdrawals imported as asset movements."
  - "Balance reconciliation across your Independent Reserve accounts."
limitations:
  - "Margin and derivatives history is not imported."
setup:
  - "In Independent Reserve, open Settings → API Keys → Create new key."
  - "Grant read-only scopes only and leave trade and withdrawal permissions off."
  - "In rotki, open API Keys → Exchanges → Add Independent Reserve and paste the key and secret."
faq:
  - q: "Where are my Independent Reserve API keys sent?"
    a: "rotki is a local application: your Independent Reserve API key is stored on your computer and used to sign each request, which goes directly from your machine to Independent Reserve's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki place trades or withdraw funds?"
    a: "No. rotki only requests read-only scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
