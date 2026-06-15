---
slug: basenames
label: "Basenames"
type: protocol
image: "/img/integrations/base.svg"
tagline: "Basenames portfolio tracker - Base's name service, decoded"
intro: "rotki decodes Basenames registrations and name transfers on Base, and resolves Basenames alongside ENS so your addresses display with human-readable names."
metaDescription: "rotki decodes Basenames registrations and name transfers on Base, and resolves Basenames alongside ENS so your addresses display with human-readable names."
keywords: "basenames portfolio tracker, base name service, basenames registration, base ens"
features:
  - "Basenames registration events decoded."
  - "Basenames transfers decoded as name-transfer events."
  - "Basenames resolution - addresses display their Basenames alongside ENS."
setup:
  - "In rotki, add your Base address. Basenames activity and resolution are automatic."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "How does rotki resolve Basenames?"
    a: "rotki is a local application that resolves Basenames by talking directly to the Base RPC endpoint you configure - the public default, a third-party provider, or your own node. The lookup goes from your computer to that endpoint without passing through any rotki-operated server or centralised name service."
  - q: "Are Basenames renewals tracked?"
    a: "Not currently. rotki decodes Basenames registrations and name transfers today; renewal events are not yet recognised on Base."
screenshots: []
ctaPlan: free
---
