---
slug: weth
label: "Wrapped Ether (WETH)"
type: protocol
image: "/img/integrations/weth.svg"
tagline: "WETH wraps and unwraps, decoded locally"
intro: "rotki decodes WETH deposit (wrap) and withdraw (unwrap) events so ETH and WETH movements appear as their underlying ETH transfer rather than confusing wrap/unwrap noise. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes WETH deposit (wrap) and withdraw (unwrap) events so ETH and WETH movements appear as their underlying ETH transfer rather than confusing"
keywords: "weth tracker, wrapped ether, eth weth wrap, weth balance tracker"
features:
  - "WETH deposit (wrap) and withdraw (unwrap) events decoded into the underlying ETH movement."
  - "WETH tracked as a token balance on the EVM chains rotki supports."
setup:
  - "In rotki, add your address under any EVM chain. WETH activity is decoded automatically."
  - "Open History and let the initial sync run. WETH events are decoded automatically."
faq:
  - q: "Why does rotki convert WETH wraps to ETH movements?"
    a: "From a cost-basis perspective WETH is ETH - wrapping or unwrapping is not a taxable event. rotki presents the underlying ETH movement to keep your event history readable."
  - q: "Which RPC does rotki use for WETH activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
