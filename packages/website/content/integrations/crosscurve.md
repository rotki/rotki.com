---
slug: crosscurve
label: "CrossCurve"
type: protocol
image: "/img/integrations/crosscurve.svg"
tagline: "Cross-chain swaps decoded as paired bridge events, source and destination linked"
intro: "CrossCurve lets you send a token on one chain and receive a (potentially different) token on another, often by routing through Curve stableswap pools and CrossCurve's own messaging layer. rotki decodes both legs of that flow so a cross-chain swap shows up as a single bridge movement instead of an unrelated spend and receive."
keywords: "CrossCurve portfolio tracker, CrossCurve bridge tracker, CrossCurve tax, curve cross-chain"
features:
  - "Source chain: the token you send through CrossCurve is labelled as a CrossCurve bridge deposit against your address."
  - "The native-token fee you pay to the CrossCurve router for cross-chain messaging is captured separately as a CrossCurve bridge fee, so it doesn't inflate the bridged amount."
  - "Destination chain: the token you receive is labelled as a CrossCurve bridge withdrawal, even when CrossCurve fulfils the swap by pulling liquidity from a Curve pool (the underlying Curve withdrawal is re-tagged to CrossCurve so it isn't double-counted)."
  - "Decoded on every EVM chain CrossCurve currently runs on: Ethereum, Arbitrum, Optimism, Base, Polygon PoS, Gnosis Chain, and BNB Smart Chain."
setup:
  - "In rotki, add the addresses on the chains you use with CrossCurve."
  - "In rotki, open History and let the initial sync run. Bridge send (fee + deposit) and bridge receive events are decoded automatically."
faq:
  - q: "Will a CrossCurve swap create a fake gain or loss?"
    a: "No. The send is tagged as a bridge deposit and the receive as a bridge withdrawal, which rotki treats as non-taxable transfers rather than a spend/receive pair."
  - q: "What if CrossCurve completes the swap via a Curve pool on the destination chain?"
    a: "rotki re-tags the underlying Curve REDEEM_WRAPPED event to the CrossCurve counterparty, so the receive is correctly attributed to your bridge instead of a Curve withdrawal."
  - q: "Does rotki read CrossCurve activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
