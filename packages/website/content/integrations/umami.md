---
slug: umami
label: "Umami"
type: protocol
image: "/img/integrations/umami.svg"
tagline: "Umami Arbitrum vaults, decoded locally"
intro: "rotki decodes Umami vault deposits and withdrawals on Arbitrum, with protocol fees shown as separate entries. You choose which Arbitrum RPC endpoint handles the queries."
keywords: "umami portfolio tracker, umami arbitrum vault, umami defi tax"
features:
  - "Umami deposits and withdrawals on Arbitrum decoded as protocol events."
  - "Protocol fees on deposit and withdraw decoded as separate entries."
setup:
  - "In rotki, add your Arbitrum address. Umami positions are detected automatically."
  - "Open History and let the initial sync run. Umami events are decoded automatically."
faq:
  - q: "Which Arbitrum RPC does rotki use for Umami activity?"
    a: "rotki is a local application that talks directly to the Arbitrum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are Umami protocol fees shown separately?"
    a: "Yes. Fees on deposit and withdraw are decoded as their own entries for clear accounting."
screenshots: []
ctaPlan: free
---
