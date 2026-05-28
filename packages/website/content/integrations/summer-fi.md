---
slug: summer-fi
label: "Summer.fi"
type: protocol
image: "/img/integrations/summer_fi.svg"
tagline: "Summer.fi vaults and proxy accounts, decoded locally"
intro: "rotki decodes Summer.fi (formerly Oasis) vault interactions and detects token balances held on Summer.fi proxy accounts. You choose which RPC endpoint handles the queries."
keywords: "summer.fi portfolio tracker, oasis defi tracker, summer fi proxy, dsproxy tracker"
features:
  - "Summer.fi vault deposits and withdrawals decoded as protocol events."
  - "Token balances held on Summer.fi proxy accounts detected."
  - "Decoded on Ethereum, Arbitrum, Optimism, and Base."
setup:
  - "In rotki, add your address under a chain where your Summer.fi activity lives."
  - "If you use a Summer.fi proxy account, its balance is included automatically once the owner address is tracked."
  - "Open History and let the initial sync run. Summer.fi events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Summer.fi activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Does rotki track balances on Summer.fi proxy accounts?"
    a: "Yes. Summer.fi proxy account balances are detected automatically once the owner address is tracked."
screenshots: []
ctaPlan: free
---
