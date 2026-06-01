---
slug: openocean
label: "OpenOcean"
type: protocol
image: "/img/integrations/openocean.png"
tagline: "OpenOcean aggregator swaps, decoded locally"
intro: "rotki decodes OpenOcean aggregator trades on rotki's supported EVM chains. You choose which RPC endpoint handles the queries."
keywords: "openocean portfolio tracker, openocean aggregator, openocean defi tax"
features:
  - "OpenOcean aggregator swaps decoded as swap events with the OpenOcean counterparty."
  - "Works on rotki's supported EVM chains where the OpenOcean exchange contract is used."
setup:
  - "In rotki, add your address under a chain where you've used OpenOcean."
  - "Open History and let the initial sync run. OpenOcean swaps are decoded automatically."
faq:
  - q: "Which RPC does rotki use for OpenOcean activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
