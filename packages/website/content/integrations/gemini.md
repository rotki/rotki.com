---
slug: gemini
label: "Gemini"
type: exchange
image: "/img/integrations/gemini.svg"
tagline: "Gemini portfolio tracker including Gemini Earn balances"
intro: "Connect Gemini to rotki to import spot trades, transfers, and balances - including Gemini Earn balances added on top of your spot wallet. rotki uses a read-only (Auditor) API key signed from your computer."
keywords: "gemini portfolio tracker, gemini tax report, gemini cost basis, gemini earn tracker"
features:
  - "Spot trades imported from the mytrades endpoint as swap events with fees."
  - "Deposits and withdrawals imported from the transfers endpoint as asset movements."
  - "Spot balances and Gemini Earn balances combined into a single portfolio view."
  - "API key permission is validated against the roles endpoint at setup: rotki refuses to proceed if the key isn't Auditor (read-only)."
limitations:
  - "Margin/derivatives history is not imported (Gemini's older retail margin product is not exposed via the connector)."
setup:
  - "In Gemini, open Settings → API → Create a new API key."
  - "Set the scope to Auditor (read-only). Leave trading and withdrawal scopes disabled."
  - "Save the key. Gemini shows the secret only once."
  - "In rotki, open API Keys → Exchanges → Add Gemini and paste the key and secret."
faq:
  - q: "Are Gemini Earn balances included?"
    a: "Yes. rotki queries the balances/earn endpoint in addition to the spot balances endpoint and combines them, so your portfolio total reflects both."
  - q: "Where are my Gemini API keys sent?"
    a: "rotki is a local application: your Gemini API key is stored on your computer and used to sign each request, which goes directly from your machine to Gemini's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki place trades on Gemini?"
    a: "No. rotki insists on an Auditor (read-only) key and refuses to proceed otherwise, so it has no permission to send trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
