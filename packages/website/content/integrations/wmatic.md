---
slug: wmatic
label: "Wrapped POL (WMATIC / WPOL)"
type: protocol
image: "/img/integrations/matic.svg"
tagline: "WPOL wraps and unwraps on Polygon, decoded locally"
intro: "rotki decodes WMATIC / WPOL deposit (wrap) and withdraw (unwrap) events so POL and WPOL movements appear as their underlying native-token transfer. You choose which Polygon RPC endpoint handles the queries."
keywords: "wmatic tracker, wpol tracker, wrapped pol, wrapped matic, polygon weth"
features:
  - "Wrap and unwrap events decoded into the underlying POL movement."
  - "WPOL tracked as a token balance alongside native POL."
setup:
  - "In rotki, add your Polygon address. WPOL activity is decoded automatically."
  - "Open History and let the initial sync run. WPOL events are decoded automatically."
faq:
  - q: "What's the difference between WMATIC and WPOL?"
    a: "Same contract, renamed alongside the MATIC-to-POL token rename. rotki handles both labels and the underlying balance."
  - q: "Which Polygon RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Polygon RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
