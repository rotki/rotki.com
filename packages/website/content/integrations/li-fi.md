---
slug: li-fi
label: "LI.FI"
type: protocol
image: "/img/integrations/lifi.svg"
tagline: "LI.FI swaps and cross-chain transfers, decoded"
intro: "rotki decodes activity routed through the LI.FI diamond - same-chain swaps and cross-chain bridge transfers - into readable events tagged with LI.FI, and matches the two legs of a bridge transfer when you track both chains."
metaDescription: "rotki decodes LI.FI swaps and cross-chain bridge transfers into readable events and matches both legs of a transfer when both chains are tracked."
keywords: "LI.FI portfolio tracker, LiFi bridge tracker, LI.FI accounting, LI.FI tax, cross-chain swap tracker"
features:
  - "Swaps executed through the LI.FI diamond decoded as paired spend/receive trades rather than loose transfers."
  - "Cross-chain transfers started through LI.FI decoded as bridge events, including routes that hand off to underlying bridges such as Relay, Squid, and Glacis."
  - "Source and destination legs matched into a single bridge transfer when both chains are tracked in rotki."
  - "The decoder runs on every EVM chain rotki supports, so LI.FI routes are recognised wherever they touch a tracked address."
limitations:
  - "Only the legs that touch an address you track can be decoded. If the destination chain is not added in rotki, the transfer shows as a one-sided bridge event."
  - "LI.FI is an aggregator: the underlying liquidity source of a route is not always identifiable on-chain, so some routes are tagged with LI.FI rather than the venue that ultimately filled them."
setup:
  - "In rotki, open Blockchain Balances and add the addresses you use with LI.FI on both the source and destination chains."
  - "Open History and let the transaction sync run. LI.FI swaps and bridge transfers are decoded automatically."
faq:
  - q: "Which chains does the LI.FI integration cover?"
    a: "The LI.FI decoder is part of rotki's shared EVM decoding layer, so it runs on every EVM chain rotki supports rather than a fixed subset."
  - q: "Why is my cross-chain transfer only showing one side?"
    a: "rotki can only decode what happened to an address it tracks. Add the destination address under Blockchain Balances and re-run the sync, and the two legs are matched into one bridge transfer."
  - q: "Does using LI.FI through rotki expose my addresses?"
    a: "No. rotki reads the transactions from the chain through the RPC endpoint you configure. It does not call LI.FI's API on your behalf and nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
