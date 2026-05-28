---
slug: cowswap
label: "CoW Swap"
type: protocol
image: "/img/integrations/cowswap.jpg"
tagline: "Batch-auction swaps and vCOW claims, decoded"
intro: "rotki decodes CoW Swap trades on Ethereum and Gnosis Chain, including native-ETH orders via the ethflow contracts and vCOW claim/vesting flows."
keywords: "cowswap portfolio tracker, cow protocol tracker, cowswap defi tax, cow swap history"
features:
  - "GPv2 settlement trades decoded as swap events (spend/receive) with fees attributed to CoW Swap."
  - "ETH-native orders via the CoW ethflow contracts decoded: place, refund, and invalidate events recognised."
  - "vCOW claim and vesting decoded; vCOW returned and COW received are linked through the CoW counterparty."
limitations:
  - "CoW Swap decoding currently ships only for Ethereum and Gnosis Chain; other CoW deployments are not yet covered."
setup:
  - "In rotki, add the Ethereum and/or Gnosis Chain address you use with CoW Swap."
  - "In rotki, open History and let the initial sync run. Trades, ethflow orders, and vCOW claims are decoded automatically."
faq:
  - q: "Are native-ETH (ethflow) trades supported?"
    a: "Yes. Orders placed through the CoW ethflow contracts are decoded as CoW Swap trades, with placement, refund, and invalidation events recognised."
  - q: "Does rotki read CoW Swap trades from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
