---
slug: cryptocom
label: "Crypto.com"
type: exchange
image: "/img/integrations/crypto_com.svg"
tagline: "Crypto.com Exchange API and mobile-app CSV, both supported"
intro: "Connect Crypto.com to rotki to import trades, deposits, and withdrawals from the Crypto.com Exchange API, and bring in your mobile-app history (recurring buys, swaps, supercharger, earn, and rewards) via CSV import."
metaDescription: "Connect Crypto.com to rotki to import trades, deposits, and withdrawals from the Crypto.com Exchange API, and bring in your mobile-app history (recurring buys"
keywords: "crypto.com portfolio tracker, crypto.com tax report, crypto.com cost basis, crypto.com csv import, crypto.com mobile app tracker"
features:
  - "Crypto.com Exchange API: spot trades imported as swap events with fees."
  - "Crypto.com Exchange API: deposits and withdrawals imported as asset movements."
  - "Mobile-app CSV: recurring buys imported as swap events."
  - "Mobile-app CSV: dynamic coin swaps, wallet swaps, lockup swaps, and interest swaps each recognised and converted to swap events."
  - "Mobile-app CSV: rewards (Crypto.com Visa rebates, MCO stake reward, pay checkout reward, supercharger reward, crypto earn interest, etc.) imported as receive events."
  - "Mobile-app CSV: supercharger and crypto earn deposits/withdrawals tracked separately from spot transfers."
limitations:
  - "Crypto.com Exchange API only returns the last 6 months of trades, deposits, and withdrawals. For older history, use the mobile-app CSV export."
setup:
  - "Crypto.com Exchange: open Settings → API → Create New API Key and set permissions to read-only."
  - "In rotki, open API Keys → Exchanges → Add Crypto.com and paste the key and secret."
  - "Mobile app: in the Crypto.com app, export your transaction history as CSV."
  - "In rotki, open Import Data and select the Crypto.com CSV."
faq:
  - q: "Does rotki support both the Crypto.com Exchange and the mobile app?"
    a: "Yes. The Exchange uses the API key path; the mobile app uses CSV import. Combine both for a complete history."
  - q: "Why is my older Exchange history missing?"
    a: "Crypto.com's Exchange API only returns the most recent 6 months. For older trades and transfers, fall back to the mobile-app CSV export."
  - q: "Where are my Crypto.com API keys sent?"
    a: "rotki is a local application: your Crypto.com API key is stored on your computer and used to sign each request, which goes directly from your machine to Crypto.com's API. No rotki-operated server ever sees the key or the request."
  - q: "Can rotki trade or withdraw on Crypto.com?"
    a: "No. rotki only requests read scopes and never sends trade or withdrawal calls."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
