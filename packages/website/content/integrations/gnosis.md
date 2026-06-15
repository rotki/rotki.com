---
slug: gnosis
label: "Gnosis"
type: blockchain
image: "/img/integrations/gnosis.svg"
tagline: "Gnosis Chain portfolio tracker that never asks for your keys"
intro: "Add your Gnosis Chain addresses to rotki and get balances, decoded transactions, and counterparty-tagged DeFi activity. rotki is a local application that talks directly to the Gnosis RPC endpoint you configure, with no rotki-operated server in the middle."
metaDescription: "Add your Gnosis Chain addresses to rotki and get balances, decoded transactions, and counterparty-tagged DeFi activity."
keywords: "gnosis chain portfolio tracker, xdai tracker, gno wallet tracker, gnosis chain tax report"
features:
  - "xDAI (native gas), GNO, and ERC-20 token balances per tracked address."
  - "Transaction history decoded into readable events: transfers, swaps, deposits, withdrawals, protocol interactions."
  - "Counterparty-tagged Gnosis Chain decoders include Aave, Aura Finance, Balancer, CoW Swap, CrossCurve, Curve, Giveth, Hop, Magpie, 1inch, Paraswap, Safe, Spark, Sushiswap, WXDAI, and Yearn."
  - "Both official Ethereum ↔ Gnosis bridges decoded: xDai bridge (DAI ↔ xDAI) and Omnibridge (ERC-20). See the [Gnosis bridges](/integrations/gnosis-chain) page for the cross-chain decoding details."
  - "Gnosis Pay and Monerium activity on Gnosis Chain decoded against their own counterparties."
setup:
  - "In rotki, open Blockchain Balances → Gnosis → Add address. Paste your address, optionally with a label."
  - "Optional: configure your preferred Gnosis RPC endpoint in Settings (a public default is provided)."
  - "In rotki, open History and let the initial sync run. Balances and decoded events populate automatically."
faq:
  - q: "Are Gnosis bridges decoded?"
    a: "Yes. Both the xDai bridge (DAI ↔ xDAI) and the Omnibridge (ERC-20) are decoded, with source and destination legs tagged as bridge events. See the [Gnosis bridges](/integrations/gnosis-chain) page."
  - q: "Where do my Gnosis address queries go?"
    a: "rotki is a local application that talks directly to the Gnosis RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Can I run rotki against my own Gnosis node?"
    a: "Yes. Point rotki at your own RPC endpoint in Settings."
screenshots: []
ctaPlan: free
---
