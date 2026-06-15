---
slug: farcaster
label: "Farcaster"
type: protocol
image: "/img/integrations/farcaster.png"
tagline: "Farcaster Pro subscription payments on Base, decoded"
intro: "rotki decodes Farcaster Pro tier purchases on Base, tagging the USDC payment as a Farcaster subscription so the spend shows up in your history with the tier and duration in the notes."
metaDescription: "rotki decodes Farcaster Pro tier purchases on Base, tagging the USDC payment as a Farcaster subscription so the spend shows up in your history with the tier"
keywords: "farcaster portfolio tracker, farcaster pro subscription, farcaster pro tracker, farcaster base payment"
features:
  - "Farcaster Pro tier purchases on Base are decoded: the USDC spend is tagged as a payment-subtype event against the Farcaster counterparty."
  - "Event notes record which tier was purchased and the duration in days, so subscription renewals are easy to identify in your history."
limitations:
  - "Farcaster decoding covers Pro tier purchases only. Other Farcaster on-chain actions (FID registration, storage rent, key registrations, etc.) are not yet decoded as Farcaster-counterparty events."
setup:
  - "In rotki, add the Base address you used to pay for Farcaster Pro."
  - "In rotki, open History and let the initial sync run. Pro tier purchases are decoded automatically."
faq:
  - q: "Does rotki decode FID registrations or storage rent?"
    a: "Not currently. The Farcaster decoder is scoped to Pro tier purchases on Base; other on-chain Farcaster actions appear as ordinary token movements."
  - q: "Does rotki read Farcaster activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Base RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
