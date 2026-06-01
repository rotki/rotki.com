---
slug: gitcoin
label: "Gitcoin"
type: protocol
image: "/img/integrations/gitcoin.svg"
tagline: "Gitcoin Grants donations, votes, and matching payouts, decoded"
intro: "rotki decodes Gitcoin Grants activity for both the legacy bulk-checkout flow and the Allo Protocol v2 rounds: donations you send (as a donate-subtype spend) and donations you receive (matched payouts, direct grants, retro funding) all flow into your history tagged against the Gitcoin counterparty."
keywords: "gitcoin portfolio tracker, gitcoin grants tracker, gitcoin donation tax, gitcoin rounds, gitcoin allo, gitcoin retro funding"
features:
  - "Gitcoin v1 (bulk checkout) donations decoded on Ethereum, Arbitrum One, Optimism, and Polygon PoS."
  - "Gitcoin v2 (Allo Protocol) donations, voted donations, and direct-grant payouts decoded on Ethereum and Polygon PoS."
  - "Outgoing donations: matching token spends are re-tagged as donate-subtype events against the Gitcoin counterparty."
  - "Incoming donations and matching payouts: token receives are tagged as donate-subtype receives so grantee income is identifiable in your history."
  - "Allo v2 round registration, profile creation, and allocation/payout events are decoded so the lifecycle of your grant or round is captured."
  - "Allo retro-funding strategy payouts (Optimism RetroPGF-style rounds) decoded as donate-subtype receives."
setup:
  - "In rotki, add the addresses you use with Gitcoin on Ethereum, Arbitrum One, Optimism, and/or Polygon PoS."
  - "In rotki, open History and let the initial sync run. Donations, payouts, and Allo round events are decoded automatically."
faq:
  - q: "Are matched-funding payouts captured?"
    a: "Yes. Matching pool payouts to grantees in both v1 (bulk checkout) and v2 (Allo) rounds are decoded as donate-subtype receives against the Gitcoin counterparty."
  - q: "Are retro funding distributions captured?"
    a: "Yes. Allo v2 retro-funding-strategy payouts are decoded as donate-subtype receives against the Gitcoin counterparty."
  - q: "Does rotki read Gitcoin activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
