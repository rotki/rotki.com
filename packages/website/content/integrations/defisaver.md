---
slug: defisaver
label: "DeFi Saver"
type: protocol
image: "/img/integrations/defisaver.jpeg"
tagline: "DeFi Saver automation subscriptions, decoded"
intro: "rotki recognises DeFi Saver automation subscription events on Ethereum, so subscribing to or deactivating an automation strategy shows up as a DeFi Saver event in your history."
metaDescription: "rotki recognises DeFi Saver automation subscription events on Ethereum, so subscribing to or deactivating an automation strategy shows up as a DeFi Saver event"
keywords: "defisaver portfolio tracker, defisaver automation, defi leverage tracker"
features:
  - "Subscribe-to-automation events on the DeFi Saver SubStorage contract decoded as informational DeFi Saver events with the subscription ID and proxy address noted."
  - "Deactivate-automation events decoded as informational DeFi Saver events with the subscription ID noted."
  - "DeFi Saver positions held via a DSProxy benefit from rotki's generic DSProxy resolution: when you add the owner address, rotki also resolves the proxy so its on-chain activity is included."
limitations:
  - "DeFi Saver-specific decoding is currently limited to automation subscribe/deactivate events. The underlying actions performed by an automation run (e.g. on MakerDAO, Liquity, Aave, or Compound) are decoded by each protocol's own decoder, not by a DeFi Saver-aware composite."
setup:
  - "In rotki, add the Ethereum owner address you use with DeFi Saver. Any DSProxy it owns is resolved automatically."
  - "In rotki, open History and let the initial sync run. Subscribe/deactivate events on the DeFi Saver SubStorage contract are decoded automatically; the underlying MakerDAO/Liquity/Aave/Compound activity is decoded by those protocols' integrations."
faq:
  - q: "Does rotki recognise DeFi Saver-created DSProxies?"
    a: "Yes, but not as DeFi Saver-specific. DSProxies are resolved generically from your owner address, so any positions held via a DSProxy (DeFi Saver-created or not) flow into your portfolio."
  - q: "Are automation runs labelled as DeFi Saver activity?"
    a: "Only the subscribe and deactivate calls are tagged against DeFi Saver. The on-chain actions performed by an automation run are decoded by the underlying protocol's integration (MakerDAO, Liquity, Aave, etc.)."
  - q: "Does rotki read DeFi Saver activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
