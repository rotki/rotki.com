---
slug: iconomi
label: "ICONOMI"
type: exchange
image: "/img/integrations/iconomi.svg"
tagline: "ICONOMI strategy trades and balances, locally signed"
intro: "Connect ICONOMI to rotki to import your strategy trades and balances. rotki uses a read-only API key signed from your machine."
metaDescription: "Connect ICONOMI to rotki to import your strategy trades and balances. rotki uses a read-only API key signed from your machine."
keywords: "iconomi portfolio tracker, iconomi tax report, iconomi cost basis"
features:
  - "Strategy buys and sells imported as swap events from your ICONOMI activity."
  - "Balance reconciliation across your ICONOMI strategies and free assets."
limitations:
  - "Only buy and sell activity is imported as trades; plain deposits and withdrawals are not retrieved."
  - "Margin and derivatives history is not imported."
setup:
  - "In ICONOMI, open Settings → API Keys → Generate new key."
  - "Set the scope to read-only and leave trade-creation permissions off."
  - "In rotki, open API Keys → Exchanges → Add ICONOMI and paste the key and secret."
faq:
  - q: "Where are my ICONOMI API keys sent?"
    a: "rotki is a local application: your ICONOMI API key is stored on your computer and used to sign each request, which goes directly from your machine to ICONOMI's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki place trades on ICONOMI?"
    a: "No. rotki only requests read-only scopes and never sends trade calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
