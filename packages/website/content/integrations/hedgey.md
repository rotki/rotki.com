---
slug: hedgey
label: "Hedgey"
type: protocol
image: "/img/integrations/hedgey_light.svg"
tagline: "Hedgey voting token lockups and plan redemptions on Ethereum, decoded"
intro: "rotki decodes the Hedgey voting-token-lockups flow on Ethereum: when you create a voting vault for a lockup, when you (re)delegate the locked voting power, and when you redeem unlocked tokens out of a plan. Outstanding Hedgey lockup balances are also queried so they show up in your portfolio."
keywords: "hedgey portfolio tracker, hedgey vesting, hedgey voting lockup, hedgey plan redemption"
features:
  - "Voting Vault creation: when a lockup creates its voting vault, the matching delegate-changed event is decoded as a governance-subtype event against the Hedgey counterparty, with the plan ID in the notes."
  - "Direct delegate calls to the voting-token-lockups contract are decoded as governance events, including the case where you re-delegate multiple plans in one call (the plan IDs are listed in the notes)."
  - "Plan redemption: when you redeem unlocked tokens, the token receive is tagged as a reward-subtype receive against the Hedgey counterparty, with the redeemed amount, token, and plan ID in the notes."
  - "Outstanding Hedgey voting-token lockup balances are queried on demand and included in your portfolio."
limitations:
  - "Hedgey decoding currently covers the voting-token-lockups contract on Ethereum (vault creation, delegate changes, and plan redemption). Other Hedgey products (non-voting plans, OTC, token claims) are not decoded as Hedgey-counterparty events."
setup:
  - "In rotki, add the Ethereum address that owns the Hedgey plan."
  - "In rotki, open History and let the initial sync run. Vault creation, delegate changes, and plan redemptions are decoded automatically; outstanding lockup balances are queried on demand."
faq:
  - q: "Are Hedgey vesting redemptions captured?"
    a: "Yes. PlanRedeemed events from the voting-token-lockups contract are decoded as reward-subtype receives against the Hedgey counterparty, with the plan ID recorded."
  - q: "Does rotki read Hedgey activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
