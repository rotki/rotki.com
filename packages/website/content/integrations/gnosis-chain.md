---
slug: gnosis-chain
label: "Gnosis bridges"
type: protocol
image: "/img/integrations/gnosis.svg"
tagline: "xDai bridge and Omnibridge transfers between Ethereum and Gnosis Chain, decoded"
intro: "rotki decodes both official Gnosis bridges between Ethereum and Gnosis Chain: the xDai bridge (for DAI ↔ xDAI, Gnosis Chain's native gas token) and the Omnibridge (for ERC-20s). Both legs of each transfer are tagged as bridge events so the same asset isn't double-counted as a spend and an unrelated receive. For Gnosis Chain balances and account activity see the [Gnosis](/integrations/gnosis) blockchain integration."
keywords: "gnosis omnibridge tracker, gnosis chain bridge, xdai bridge tracker"
features:
  - "xDai bridge: deposits of DAI on Ethereum and the matching xDAI receive on Gnosis Chain are tagged as bridge events against the bridge counterparty, so the cross-chain transfer reads as one operation rather than a DAI spend plus an xDAI receive."
  - "Omnibridge: ERC-20 deposits on either side are tagged as bridge deposits, and the matching receives on the destination chain are tagged as bridge withdrawals."
  - "Both bridges decoded symmetrically: rotki picks up the source side when run against the source chain and the destination side when run against the destination chain."
setup:
  - "In rotki, add the address you use with the bridges on both Ethereum and Gnosis Chain so each leg is captured."
  - "In rotki, open History and let the initial sync run. xDai bridge and Omnibridge events are decoded automatically on whichever chain you queried."
faq:
  - q: "How is this different from the Gnosis integration?"
    a: "The Gnosis integration covers balances and account activity on Gnosis Chain itself. This page covers the two official bridges between Ethereum and Gnosis Chain (xDai bridge and Omnibridge)."
  - q: "Will a Gnosis bridge transfer create a fake gain or loss?"
    a: "No. Both legs are tagged as bridge events, which rotki treats as non-taxable transfers rather than a spend/receive pair."
  - q: "Does rotki read bridge activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
