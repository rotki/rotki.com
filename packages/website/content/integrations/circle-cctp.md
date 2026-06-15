---
slug: circle-cctp
label: "Circle CCTP"
type: protocol
image: "/img/integrations/cctp.svg"
tagline: "Native USDC bridging decoded as bridge events, not taxable disposals"
intro: "rotki decodes Circle's Cross-Chain Transfer Protocol (CCTP v1 and v2) on both source and destination chains, tagging the USDC burn and mint as bridge events so they don't flow through your PnL as ordinary spends and receives."
metaDescription: "rotki decodes Circle's Cross-Chain Transfer Protocol (CCTP v1 and v2) on both source and destination chains, tagging the USDC burn and mint as bridge events so"
keywords: "circle cctp tracker, native usdc bridge, cctp usdc tracker, cross chain usdc"
features:
  - "CCTP v1 burn-and-mint events decoded on both sides of the bridge."
  - "CCTP v2 burn-and-mint events decoded on both sides of the bridge."
  - "USDC moved via CCTP is tagged as a bridge deposit on the source chain and a bridge withdrawal on the destination chain, so cost basis isn't disturbed."
  - "Decoded across all CCTP-enabled chains rotki currently supports: Ethereum, Arbitrum, Base, Optimism, Polygon PoS, Monad, and Hyperliquid."
setup:
  - "In rotki, add your addresses on both the source and destination chains you use with CCTP."
  - "In rotki, open History and let the initial sync run. CCTP transfers on both sides are decoded automatically."
faq:
  - q: "Does rotki read CCTP transfers from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Will my CCTP bridge create a fake gain or loss?"
    a: "No. The burn and the mint are both tagged as bridge events, which rotki treats as non-taxable transfers rather than spends or receives."
screenshots: []
ctaPlan: free
---
