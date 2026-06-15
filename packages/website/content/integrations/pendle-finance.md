---
slug: pendle-finance
label: "Pendle Finance"
type: protocol
image: "/img/integrations/pendle_light.svg"
tagline: "Pendle PT, YT, LP, and vePendle, decoded locally"
intro: "rotki decodes Pendle swaps into and out of Principal Tokens (PT) and Yield Tokens (YT), tracks your Pendle balances, and decodes vePendle locks and reward claims. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes Pendle swaps into and out of Principal Tokens (PT) and Yield Tokens (YT), tracks your Pendle balances, and decodes vePendle locks and reward"
keywords: "pendle finance portfolio tracker, pendle pt yt tracker, vependle, pendle lp tracker, pendle defi tax"
features:
  - "Swaps into and out of Principal Tokens (PT) and Yield Tokens (YT) decoded as swap events."
  - "Pendle position balances (PT, YT, and LP) queried and included in your portfolio."
  - "vePendle locks decoded, labelled with the PENDLE amount and the unlock date."
  - "Reward claims decoded, including transactions that claim several rewards at once."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, BNB Smart Chain, and Hyperliquid (vePendle locking is on Ethereum)."
setup:
  - "In rotki, add your address under a chain where you use Pendle. Positions are detected automatically."
  - "Open History and let the initial sync run. Pendle events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Pendle activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are PT and YT positions priced separately?"
    a: "Yes. Principal Tokens and Yield Tokens are tracked with their own balances and prices."
  - q: "Is vePendle tracked?"
    a: "Yes. vePendle locks are decoded and your locked PENDLE appears in your portfolio."
screenshots: []
ctaPlan: free
---
