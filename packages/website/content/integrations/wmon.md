---
slug: wmon
label: "WMON"
type: protocol
image: "/img/integrations/wmon.svg"
tagline: "Wrapped MON wraps and unwraps on Monad, decoded locally"
intro: "rotki decodes WMON deposit (wrap) and withdraw (unwrap) events on Monad so MON and WMON movements appear as their underlying native-token transfer. You choose which Monad RPC endpoint handles the queries."
keywords: "wmon portfolio tracker, wrapped mon, monad weth, wmon tracker"
features:
  - "Wrap and unwrap events decoded into the underlying MON movement."
  - "WMON tracked as a token balance alongside native MON."
setup:
  - "In rotki, add your Monad address. WMON activity is decoded automatically."
  - "Open History and let the initial sync run. WMON events are decoded automatically."
faq:
  - q: "What is WMON?"
    a: "WMON is the ERC-20 wrapper of Monad's native MON token, the equivalent of WETH on Ethereum."
  - q: "Which Monad RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Monad RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
