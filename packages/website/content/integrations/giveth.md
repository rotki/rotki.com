---
slug: giveth
label: "Giveth"
type: protocol
image: "/img/integrations/giveth.jpg"
tagline: "Giveth donations, GIVpower locks, and GIV reward claims, decoded"
intro: "rotki decodes Giveth activity across the chains Giveth is deployed on: donations you send (split per recipient for multi-donations), donations you receive as a project, GIV locks into GIVpower rounds, and GIV reward claims from the distributor."
keywords: "giveth portfolio tracker, giv token tracker, giveth donations tax, givpower tracker, givreward"
features:
  - "Outgoing donations through Giveth tagged as donate-subtype spends against the Giveth counterparty. Native-token multi-donations to several recipients in one transaction are split into per-recipient donation events instead of collapsing into one aggregate spend."
  - "Incoming donations (when you're the project receiving) tagged as donate-subtype receives so grantee income is identifiable in your history."
  - "GIV locking for GIVpower: the GIV lock is recorded against the Giveth counterparty with the number of rounds locked, and the matching POW receive is linked."
  - "GIV reward claims from the Giveth distributor are tagged as reward-subtype receives against the Giveth counterparty."
  - "Decoded on every chain Giveth currently runs on: Ethereum, Gnosis Chain, Polygon PoS, Arbitrum One, Optimism, and Base."
setup:
  - "In rotki, add the addresses you use with Giveth on Ethereum, Gnosis, Polygon PoS, Arbitrum, Optimism, and/or Base."
  - "In rotki, open History and let the initial sync run. Donations, GIVpower locks, and GIV reward claims are decoded automatically."
faq:
  - q: "Are GIV rewards tracked as income?"
    a: "Yes. GIV reward claims from the Giveth distributor are tagged as reward-subtype receives against the Giveth counterparty."
  - q: "What happens with a multi-recipient native-token donation?"
    a: "rotki splits the single aggregate spend into one donation event per recipient, so each grantee shows up correctly in your history with their share."
  - q: "Does rotki read Giveth activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
