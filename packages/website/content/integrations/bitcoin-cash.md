---
slug: bitcoin-cash
label: "Bitcoin Cash"
type: blockchain
image: "/img/integrations/bitcoin-cash.svg"
tagline: "Bitcoin Cash portfolio tracker - xpub-aware, locally tracked"
intro: "Track Bitcoin Cash addresses or whole wallets via xpub keys."
keywords: "bitcoin cash portfolio tracker, bch wallet tracker, bch xpub tracker, bitcoin cash tax report, cashaddr tracker"
features:
  - "Single BCH addresses (CashAddr or legacy format) or whole wallets via xpub keys."
  - "Automatic address derivation from your extended public keys."
  - "CashAddr ↔ legacy conversion: paste either format; rotki normalises addresses internally."
  - "Multi-wallet: combine multiple xpubs and standalone BCH addresses in one rotki instance."
  - "Same xpub on Bitcoin and Bitcoin Cash: each chain stores its own entry, so there is no collision when sharing keys across both."
setup:
  - "In rotki, open Blockchain & Accounts → Bitcoin Cash → Add."
  - "Paste a BCH address (CashAddr or legacy) or an xpub. rotki derives sub-addresses automatically."
  - "Optional: in Settings → RPC, point at your preferred BCH endpoint."
faq:
  - q: "Where do my BCH addresses and xpubs go?"
    a: "Only to the BCH endpoint you configure. rotki does not proxy through its own servers."
  - q: "Can I add the same xpub to both Bitcoin and Bitcoin Cash?"
    a: "Yes. rotki treats the two chains as separate xpub entries (uniqueness is xpub + derivation path + chain), so a single seed can be tracked on both without conflict."
  - q: "Does rotki accept legacy BCH addresses?"
    a: "Yes. Both legacy and CashAddr formats are accepted on input, and rotki converts between them as needed when querying balances."
screenshots: []
ctaPlan: free
---
