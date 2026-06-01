---
slug: binance
label: "Binance"
type: exchange
image: "/img/integrations/binance.svg"
tagline: "Binance portfolio tracker - read-only, runs on your machine"
intro: "Connect your Binance account to rotki and import spot trades, deposits and withdrawals, Convert swaps, margin and futures positions, and Simple Earn interest. Use a read-only API key or import Binance's CSV exports."
keywords: "binance portfolio tracker, binance tax report, binance cost basis, binance csv import, binance futures tracker, binance earn tracker"
features:
  - "Spot trades - full trade history once you select your market pairs."
  - "Deposits and withdrawals - reconciled against your balance history."
  - "Binance Convert - quick swaps imported as trades."
  - "Cross-collateral and margin futures - balances and positions for COIN-M (dapi) and USD-M (fapi)."
  - "Simple Earn - flexible and locked interest history."
  - "CSV import - load Binance's exported trade and history CSVs for periods before your API key existed."
limitations:
  - "Binance does not return trades for delisted markets via API; CSV import is the workaround."
  - "You must paste your market pairs into rotki - Binance's API requires the pair to query its trades."
  - "Binance Convert history is limited by Binance to a 30-day window per request, so deep history takes longer to sync."
setup:
  - "In Binance, open Account → API Management and click \"Create API\"."
  - "Restrict permissions to \"Enable Reading\" only. Leave trading, withdrawals, and futures-trading permissions off."
  - "Optionally enable IP whitelist for extra safety."
  - "In rotki, open API Keys → Exchanges → Add Binance, paste the API key and secret."
  - "Paste your active market pairs (e.g. BTCUSDT, ETHUSDT) so rotki knows which markets to query."
faq:
  - q: "Does rotki support Binance Futures?"
    a: "Yes. rotki queries USD-M and COIN-M margined futures balances. Make sure the API key has \"Enable Reading\" for futures."
  - q: "Why does rotki ask for market pairs?"
    a: "Binance's API only returns trades when you specify a pair. rotki asks you to paste your active pairs so it can query each one. You can paste multiple pairs at once."
  - q: "Can I track Binance.US and global Binance in the same rotki instance?"
    a: "Yes. Binance.US is a separate integration in rotki - add both with their own API keys."
  - q: "Where are my Binance API keys sent?"
    a: "rotki is a local application: your Binance API key is stored on your computer and used to sign each request, which goes directly from your machine to Binance's API. No rotki-operated server ever sees the key or the request."
screenshots: []
ctaPlan: free
isExchangeWithKey: true
---
