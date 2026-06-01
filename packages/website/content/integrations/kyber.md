---
slug: kyber
label: "KyberSwap"
type: protocol
image: "/img/integrations/kyber.svg"
tagline: "KyberSwap aggregator swaps with refunds, decoded locally"
intro: "rotki decodes KyberSwap aggregator trades, including swaps with refunds, where the refund is deducted from the original swap amount for a clean result. You choose which RPC endpoint handles the queries."
keywords: "kyber portfolio tracker, kyberswap tracker, kyber aggregator, kyber defi tax"
features:
  - "KyberSwap aggregator trades decoded as swap events."
  - "Swaps with a refund are netted, so the refund is deducted from the original swap amount."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, Polygon, Scroll, Monad, and Hyperliquid."
setup:
  - "In rotki, add your address under a chain where you've used KyberSwap."
  - "Open History and let the initial sync run. KyberSwap trades are decoded automatically."
faq:
  - q: "Which RPC does rotki use for KyberSwap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are refunds handled?"
    a: "Yes. When a KyberSwap trade returns a refund, rotki deducts it from the original swap amount so your cost basis stays accurate."
screenshots: []
ctaPlan: free
---
