---
slug: wxdai
label: "Wrapped xDAI (WXDAI)"
type: protocol
image: "/img/integrations/wxdai.png"
tagline: "WXDAI wraps and unwraps on Gnosis Chain, decoded locally"
intro: "rotki decodes WXDAI deposit (wrap) and withdraw (unwrap) events so xDAI and WXDAI movements appear as their underlying native-token transfer. You choose which Gnosis RPC endpoint handles the queries."
metaDescription: "rotki decodes WXDAI deposit (wrap) and withdraw (unwrap) events so xDAI and WXDAI movements appear as their underlying native-token transfer."
keywords: "wxdai tracker, wrapped xdai, gnosis chain weth equivalent"
features:
  - "Wrap and unwrap events decoded into the underlying xDAI movement."
  - "WXDAI tracked as a token balance alongside native xDAI."
setup:
  - "In rotki, add your Gnosis address. WXDAI activity is decoded automatically."
  - "Open History and let the initial sync run. WXDAI events are decoded automatically."
faq:
  - q: "What is WXDAI?"
    a: "WXDAI is the ERC-20 wrapper of Gnosis Chain's native xDAI, the equivalent of WETH on Ethereum."
  - q: "Which Gnosis RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Gnosis RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
