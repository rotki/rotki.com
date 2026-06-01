---
slug: socket
label: "Socket"
type: protocol
image: "/img/integrations/socket.png"
tagline: "Socket (Bungee) cross-chain bridge, decoded locally"
intro: "rotki decodes Socket (Bungee) cross-chain bridge transactions. You choose which RPC endpoint handles the queries."
keywords: "socket bridge tracker, bungee bridge tracker, socket protocol portfolio, cross chain bridge tracker"
features:
  - "Socket (Bungee) bridge transactions decoded as protocol events on rotki's supported EVM chains."
  - "Bridge legs linked across chains where both ends are tracked, so transferred assets aren't double-counted."
setup:
  - "In rotki, add your addresses on both the source and destination chains."
  - "Open History and let the initial sync run. Socket bridge events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Socket activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
