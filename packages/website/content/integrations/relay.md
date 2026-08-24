---
slug: relay
label: "Relay"
type: protocol
image: "/img/integrations/relay.svg"
tagline: "Relay cross-chain transfers, decoded"
intro: "rotki recognises the Relay solvers that settle your cross-chain transfers and turns the incoming payout into a proper bridge withdrawal event instead of an unexplained receive."
metaDescription: "rotki recognises Relay solvers and decodes their payouts as bridge withdrawals instead of unexplained incoming transfers."
keywords: "Relay bridge tracker, relay.link portfolio tracker, Relay accounting, Relay tax, cross-chain transfer tracker"
features:
  - "Transfers filled by a known Relay solver are decoded as bridge withdrawals tagged with Relay, so they are not left as anonymous incoming transfers."
  - "Solver addresses are maintained per chain, covering Ethereum, Optimism, BNB Smart Chain, Gnosis, Polygon PoS, Base, Hyperliquid, and the other EVM chains rotki supports."
  - "Relay legs reached through an aggregator such as LI.FI are recognised as part of the same cross-chain transfer."
  - "Matched with the outgoing leg into a single bridge transfer when the source chain is tracked in rotki."
limitations:
  - "Recognition is based on the published Relay solver addresses. A transfer filled by a solver rotki does not yet know about is decoded as an ordinary receive."
  - "Only legs touching an address you track are decoded. If the source chain is not added in rotki, the payout shows as a one-sided bridge event."
setup:
  - "In rotki, open Blockchain Balances and add the addresses you bridge from and to."
  - "Open History and let the transaction sync run. Relay payouts are decoded automatically."
faq:
  - q: "Why is my Relay payout still showing as a plain receive?"
    a: "The transfer was likely filled by a solver address rotki does not track yet. Relay's solver set changes over time and rotki ships the published list; a newer solver may only be recognised in a later release."
  - q: "Does rotki call Relay's API?"
    a: "No. rotki reads the transactions from the chain through the RPC endpoint you configure and matches them against the solver addresses shipped with the application."
  - q: "Can rotki match the send and the receive across chains?"
    a: "Yes, as long as both addresses are tracked in rotki. Otherwise only the leg on the tracked chain exists to be shown."
screenshots: []
ctaPlan: free
---
