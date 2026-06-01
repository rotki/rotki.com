---
slug: drips
label: "Drips"
type: protocol
image: "/img/integrations/drips.png"
tagline: "Drips v1 streaming payments, decoded"
intro: "rotki decodes Drips v1 activity on Ethereum and Polygon PoS: outgoing gifts (Give) and ongoing streams (Drip) you send, splits you configure, and funds you collect from incoming drips."
keywords: "drips portfolio tracker, drips network, streaming payments tracker, drips splits"
features:
  - "Outgoing Give calls labelled as donations against the Drips counterparty."
  - "Ongoing Dripping configurations recorded as informational events with the stream parameters, and the corresponding spends tagged as donations."
  - "Splits and SplitsUpdated configurations recorded as informational Drips events."
  - "Collected receives (funds drawn from an incoming Drip) tagged as donate-subtype receives against the Drips counterparty."
limitations:
  - "Only Drips v1 (the original DAI-centric streaming contracts) is decoded. Drips v2 (the newer Radicle Drips deployment) is not yet covered."
  - "Drips v1 is decoded on Ethereum and Polygon PoS only."
setup:
  - "In rotki, add the addresses you use with Drips on Ethereum and/or Polygon PoS."
  - "In rotki, open History and let the initial sync run. Give, Drip, Split, and Collected events are decoded automatically."
faq:
  - q: "Are incoming Drips income?"
    a: "rotki labels Collected receives as donate-subtype events against the Drips counterparty. Whether they are taxable income is jurisdiction-specific; consult a tax professional."
  - q: "Does rotki read Drips activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
