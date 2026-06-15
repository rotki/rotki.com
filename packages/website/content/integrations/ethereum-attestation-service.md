---
slug: ethereum-attestation-service
label: "Ethereum Attestation Service"
type: protocol
image: "/img/integrations/eas.png"
tagline: "EAS attestations on Ethereum, Arbitrum, Optimism, and Base, decoded with a link to easscan"
intro: "rotki decodes Ethereum Attestation Service (EAS) Attested events as informational attest events tied to your address, with a direct link to the attestation page on easscan for the chain it was made on."
metaDescription: "rotki decodes Ethereum Attestation Service (EAS) Attested events as informational attest events tied to your address, with a direct link to the attestation"
keywords: "ethereum attestation service tracker, eas tracker, easscan, on-chain attestation"
features:
  - "Attested events from the EAS attestation service contract are decoded as informational attest events against the EAS counterparty."
  - "The event notes include a direct easscan.org link to view the attestation by UID (with the correct chain-specific subdomain)."
  - "Both attester and recipient sides are matched: if either the attester or the recipient address is tracked, the event is attached to that address."
  - "Decoded on Ethereum, Arbitrum One, Optimism, and Base."
limitations:
  - "Only Attested (attestation creation) events are decoded. Revocation events are not currently decoded as EAS-counterparty events."
setup:
  - "In rotki, add the Ethereum, Arbitrum, Optimism, or Base address that attests via EAS or receives attestations."
  - "In rotki, open History and let the initial sync run. Attested events are decoded automatically with an easscan link in the notes."
faq:
  - q: "Are attestation revocations captured?"
    a: "Not as EAS-counterparty events. Only attestation creations (Attested events) are decoded."
  - q: "Does rotki read EAS activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
