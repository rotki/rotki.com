---
slug: the-graph
label: "The Graph"
type: protocol
image: "/img/integrations/thegraph.svg"
tagline: "The Graph GRT delegations and rewards, decoded locally"
intro: "rotki decodes The Graph GRT delegations and undelegations, indexer reward distributions, and delegation transfers from Ethereum to Arbitrum. You choose which RPC endpoint handles the queries."
keywords: "the graph portfolio tracker, grt staking tracker, graph delegation, indexer rewards"
features:
  - "GRT delegations and undelegations decoded as protocol events."
  - "Indexer reward distributions decoded as income."
  - "Delegation transfers from Ethereum to Arbitrum (L2) decoded."
setup:
  - "In rotki, add your Ethereum address (and your Arbitrum address if you moved delegations to L2)."
  - "Open History and let the initial sync run. The Graph events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for The Graph activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
