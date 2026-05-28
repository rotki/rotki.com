---
slug: echo
label: "Echo"
type: protocol
image: "/img/integrations/echo.png"
tagline: "Echo group-led deals on Base, decoded"
intro: "Echo is the on-chain investment platform where members follow a group lead into individual deals, with everyone's USDC commitment pooled into a single on-chain entity that invests in the target project. rotki decodes the on-chain side of that flow on Base: your commitment into a deal pool, Echo's platform fee, and full refunds if you're deregistered before the pool closes."
keywords: "echo portfolio tracker, echo fundraising, echo deal tracker, echo cobie, echo base"
features:
  - "Deal commitment: the USDC (or other deal-currency token) you send to follow a group lead into a deal is tagged as a deposit-to-protocol event against the Echo counterparty, with the deal pool address recorded in the notes."
  - "Platform fee: the on-chain fee Echo charges on top of your commitment is broken out as a fee-subtype event, so your committed capital and the fee are accounted for separately rather than as one inflated spend."
  - "Pool refund: if you're deregistered from a deal pool (full refund), the USDC you get back is tagged as a withdraw-from-protocol event against Echo and linked to the deal pool address."
limitations:
  - "Echo decoding currently ships on Base only."
  - "Only full refunds (a member being deregistered from a pool) are decoded. Partial refunds don't emit the deregistration event, so they appear as ordinary token receives; reconcile them manually if you have one."
  - "Token or equity distributions that arrive after a deal closes (project tokens, vested receivables, group-lead carry) appear as ordinary receives, not as Echo-counterparty events."
setup:
  - "In rotki, add the Base address you used to commit to Echo deals."
  - "In rotki, open History and let the initial sync run. Deal commitments, Echo platform fees, and full pool refunds are decoded automatically."
faq:
  - q: "Are Echo platform fees separated from my commitment?"
    a: "Yes. The platform fee is split out as a fee-subtype event against the Echo counterparty, so the amount you actually committed to the deal pool stays clean for cost-basis purposes."
  - q: "Does rotki read Echo activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Base RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
