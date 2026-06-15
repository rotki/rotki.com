---
slug: efp
label: "Ethereum Follow Protocol"
type: protocol
image: "/img/integrations/efp.svg"
tagline: "EFP follow, unfollow, and tag events, decoded"
intro: "rotki decodes Ethereum Follow Protocol (EFP) list operations - follow, unfollow, tag, and untag - on Ethereum, Optimism, and Base, so your on-chain social activity appears in your history with the target address (and tag) recorded."
metaDescription: "rotki decodes Ethereum Follow Protocol (EFP) list operations - follow, unfollow, tag, and untag - on Ethereum, Optimism, and Base, so your on-chain social"
keywords: "ethereum follow protocol tracker, efp tracker, on-chain social tracker"
features:
  - "Follow operations: a List Op against your EFP list is decoded as an informational EFP event noting the address you followed."
  - "Unfollow operations: recognised as informational EFP events noting the address you unfollowed."
  - "Tag and untag operations: recognised as informational EFP events with the tag label and the target address."
  - "Decoded on every chain EFP currently runs on: Ethereum, Optimism, and Base."
limitations:
  - "Only address-type list records (RecordVersion 1, RecordType 1) are decoded. Future record types and op versions will be silently skipped until the decoder is updated."
  - "List creation/minting and list-registry changes are not specifically decoded as EFP events; only operations on the list-records contract are."
setup:
  - "In rotki, add the address whose EFP list is controlled by you (the slot owner)."
  - "In rotki, open History and let the initial sync run. Follow, unfollow, tag, and untag operations are decoded automatically."
faq:
  - q: "Are EFP tags captured?"
    a: "Yes. Both tag and untag operations are decoded with the tag label and target address in the event notes."
  - q: "Does rotki read EFP activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
