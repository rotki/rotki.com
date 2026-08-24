---
slug: gate
label: "Gate"
type: exchange
image: "/img/integrations/gate.svg"
tagline: "Gate portfolio tracker - read-only, runs on your computer"
intro: "Connect Gate to rotki to pull spot balances, spot trades, and deposits and withdrawals into one local portfolio. Pick the Gate endpoint your account belongs to: Global, Europe, or US."
metaDescription: "Connect Gate to rotki to pull spot balances, spot trades, deposits, and withdrawals, against the Global, Europe, or US endpoint."
keywords: "Gate portfolio tracker, Gate.io tax report, Gate accounting, Gate cost basis"
features:
  - "Spot balances read from your Gate spot accounts."
  - "Spot trades imported from your Gate trade history."
  - "Deposits and withdrawals imported as asset movements."
  - "Choose the endpoint that matches your account - Gate Global, Gate Europe, or Gate US - so requests go to the right platform."
  - "History is walked in 30-day windows and committed as it goes, so a long history syncs without starting over."
limitations:
  - "Gate's deposit and withdrawal endpoints reject ranges longer than 30 days, so the first sync over a long history takes some time."
  - "Only the spot account is covered. Margin and futures history is not imported."
  - "There is no Gate CSV importer. The integration works through the read-only API key."
setup:
  - "In Gate, open API Management and create a new API key."
  - "Grant read-only permissions for spot and wallet. Leave trading and withdrawal scopes off."
  - "In rotki, open API Keys → Exchanges → Add Gate and paste the key and secret."
  - "Select the Gate location matching your account: Global, Europe, or US."
faq:
  - q: "Which Gate platform should I select?"
    a: "The one your account is registered on. Gate Global, Gate Europe, and Gate US are separate platforms with separate API hosts, and a key issued on one will not authenticate against another."
  - q: "Why does the first sync take a while?"
    a: "Gate limits its deposit and withdrawal endpoints to a 30-day window per request. rotki walks your history in chunks and saves progress as it goes, so an interrupted sync resumes rather than restarting."
  - q: "Where are my Gate API keys sent?"
    a: "rotki is a local application: your Gate API key is stored on your computer and used to sign each request, which goes directly from your machine to Gate's API. No rotki-operated server ever sees the key or the request."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
