---
slug: monad
label: "Monad"
type: blockchain
image: "/img/integrations/monad.svg"
tagline: "Monad balances and transactions, decoded locally"
intro: "Add your Monad addresses to rotki to track balances and decode on-chain activity. You choose which Monad RPC endpoint handles the queries."
metaDescription: "Add your Monad addresses to rotki to track balances and decode on-chain activity. You choose which Monad RPC endpoint handles the queries."
keywords: "monad portfolio tracker, monad wallet tracker, monad accounting, monad defi tax"
features:
  - "Native and token balances tracked for your Monad addresses."
  - "Monad transactions retrieved and decoded into readable history events."
  - "Protocol decoders on Monad: Uniswap, Curve, KyberSwap, Morpho, WooFi, 0x, Circle CCTP, and WMON wrapping."
setup:
  - "In rotki, open Blockchain & Accounts → Monad → Add address."
  - "Open History and let the initial sync run. Monad transactions are decoded automatically."
faq:
  - q: "Which Monad RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Monad RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Which protocols are decoded on Monad?"
    a: "rotki decodes Uniswap, Curve, KyberSwap, Morpho, WooFi, 0x, Circle CCTP, and WMON wrapping on Monad, in addition to native and token transfers."
screenshots: []
ctaPlan: free
---
