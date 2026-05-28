---
slug: fluence
label: "Fluence"
type: protocol
image: "/img/integrations/fluence.png"
tagline: "Fluence FLT-DROP and FLT claim flow, decoded"
intro: "rotki decodes the Fluence developer rewards flow on Ethereum: claiming FLT-DROP from the distributor, and the second step where FLT-DROP is burned to mint real FLT."
keywords: "fluence portfolio tracker, flt token, flt-drop, fluence airdrop, fluence dev rewards"
features:
  - "FLT-DROP claims from the Fluence dev rewards distributor are tagged against the Fluence counterparty with the claimed amount in the notes."
  - "FLT-DROP burn / FLT mint: when you convert FLT-DROP into FLT, the burn of FLT-DROP and the matching FLT receive (tagged as an airdrop subtype) are linked into a single event pair."
limitations:
  - "Fluence decoding is currently scoped to the FLT-DROP claim and the FLT-DROP-to-FLT conversion only. Fluence staking, peer/provider rewards, and other on-chain Fluence activity are not decoded as Fluence-counterparty events."
setup:
  - "In rotki, add the Ethereum address that holds FLT-DROP or claims FLT."
  - "In rotki, open History and let the initial sync run. The FLT-DROP claim and the FLT-DROP-to-FLT conversion are decoded automatically."
faq:
  - q: "Is Fluence staking decoded?"
    a: "No. Only the FLT-DROP claim and the FLT-DROP-to-FLT conversion are tagged against the Fluence counterparty."
  - q: "Does rotki read Fluence activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
