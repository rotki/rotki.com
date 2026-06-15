---
slug: degen
label: "Degen"
type: protocol
image: "/img/integrations/degen.svg"
tagline: "DEGEN airdrop claims on Base, decoded"
intro: "rotki decodes DEGEN airdrop claims on Base so each season's claim shows up against the Degen counterparty in your history."
metaDescription: "rotki decodes DEGEN airdrop claims on Base so each season's claim shows up against the Degen counterparty in your history."
keywords: "degen token tracker, degen base tracker, degen airdrop, farcaster degen"
features:
  - "Degen airdrop 1 claims decoded as airdrop receive events against the Degen counterparty."
  - "Degen airdrop 2 (Season 1) claims decoded as airdrop receive events against the Degen counterparty."
  - "Degen airdrop 3 (Season 3) claims decoded as airdrop receive events against the Degen counterparty."
limitations:
  - "Only the three known Merkle-claim airdrop contracts are decoded. Farcaster tip transfers and DEGEN swaps appear as ordinary token movements, not Degen-counterparty events."
setup:
  - "In rotki, add the Base address you used to claim DEGEN."
  - "In rotki, open History and let the initial sync run. Claims from the registered airdrop contracts are decoded automatically."
faq:
  - q: "Are Farcaster DEGEN tips decoded as Degen events?"
    a: "No. Tip transfers appear as ordinary ERC-20 receives in your history; only the official airdrop-claim contracts are tagged against the Degen counterparty."
  - q: "Does rotki read DEGEN activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Base RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
