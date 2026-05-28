---
slug: aura-finance
label: "Aura Finance"
type: protocol
image: "/img/integrations/aura-finance.png"
tagline: "Aura Finance portfolio tracker - Balancer LP boosting, decoded"
intro: "rotki decodes Aura Finance deposits, gauge withdrawals, AURA/BAL reward claims, vlAURA locking, and auraBAL vault activity across Ethereum, Arbitrum, Optimism, Polygon, Base, and Gnosis."
keywords: "aura finance portfolio tracker, aura tracker, aurabal tracker, vlaura tracker, aura balancer boost, aura defi tax"
features:
  - "Booster deposits and gauge withdrawals decoded as paired position events without double-counting the underlying BPT."
  - "AURA and BAL reward claims decoded as income events, including extra-reward and L2 booster-lite claim paths."
  - "vlAURA - locking AURA in auraLocker decoded as its own lock event (Ethereum and Base)."
  - "auraBAL - vault deposits and withdrawals decoded as auraBAL events."
  - "Multi-chain - Ethereum, Arbitrum, Optimism, Polygon, Base, and Gnosis."
setup:
  - "In rotki, add your address on any chain where you've used Aura (Ethereum, Arbitrum, Optimism, Polygon, Base, or Gnosis). Aura positions are detected automatically."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "Do my Aura positions or addresses leave my machine?"
    a: "No. rotki reads activity from the EVM RPCs you configure directly from your computer."
  - q: "Are all Aura reward claims captured?"
    a: "Yes. AURA, BAL, extra rewards, and L2 booster-lite claim paths are all decoded as income events."
screenshots: []
ctaPlan: free
---
