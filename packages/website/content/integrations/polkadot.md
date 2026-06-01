---
slug: polkadot
label: "Polkadot"
type: blockchain
image: "/img/integrations/polkadot.svg"
tagline: "Polkadot DOT balances, locally tracked"
intro: "Add your Polkadot addresses to rotki to track your DOT balances. rotki queries the Polkadot RPC endpoint you configure."
keywords: "polkadot portfolio tracker, dot wallet tracker, polkadot tax report, substrate tracker"
features:
  - "DOT address balances (free and reserved) read directly from the Substrate node you connect to."
  - "Configurable Polkadot RPC endpoint: use a public node or your own."
setup:
  - "In rotki, open Blockchain & Accounts → Polkadot → Add address."
  - "Paste your Polkadot address."
  - "Optional: in Settings → RPC, configure your preferred Polkadot endpoint."
faq:
  - q: "Which Polkadot RPC does rotki use?"
    a: "rotki is a local application that talks directly to the Polkadot RPC endpoint you configure - a public node or your own. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "What balances does rotki track for Polkadot?"
    a: "rotki reads your native DOT balance (free and reserved) from the Substrate node you connect to."
screenshots: []
ctaPlan: free
---
