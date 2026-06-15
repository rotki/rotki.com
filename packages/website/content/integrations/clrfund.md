---
slug: clrfund
label: "clr.fund"
type: protocol
image: "/img/integrations/clrfund.png"
tagline: "Quadratic funding rounds on Arbitrum, decoded"
intro: "rotki decodes clr.fund quadratic-funding activity on Arbitrum One so contributors, voters, and grant recipients have clean records. Donations, votes, project applications, and matching-pool claims are all recognised."
metaDescription: "rotki decodes clr.fund quadratic-funding activity on Arbitrum One so contributors, voters, and grant recipients have clean records."
keywords: "clr fund portfolio tracker, quadratic funding tracker, clrfund donations, clrfund arbitrum"
features:
  - "Contributions to a clr.fund round are tagged as donations against the clr.fund counterparty."
  - "Votes are recorded as informational events tied to the round."
  - "Project applications to a round's recipient registry are recognised (with the application fee, if any)."
  - "Matching-pool claims are decoded as funds-claimed events on the recipient address."
limitations:
  - "clr.fund decoding currently ships with Arbitrum One rounds only. The decoder is chain-agnostic, but no Gnosis Chain round addresses are registered."
setup:
  - "In rotki, add the Arbitrum One address you used for clr.fund."
  - "In rotki, open History and let the initial sync run. Donations, votes, applications, and matching claims for that address are decoded automatically."
faq:
  - q: "Does rotki read clr.fund activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Arbitrum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are matching-pool payouts captured?"
    a: "Yes. Funds claimed from a clr.fund funding round are decoded against the recipient address."
screenshots: []
ctaPlan: free
---
