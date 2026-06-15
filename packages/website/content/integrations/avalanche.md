---
slug: avalanche
label: "Avalanche"
type: blockchain
image: "/img/integrations/avalanche.svg"
tagline: "Avalanche C-Chain tracker - AVAX balances, locally"
intro: "Add your Avalanche C-Chain addresses to rotki to track your AVAX balances locally."
metaDescription: "Add your Avalanche C-Chain addresses to rotki to track your AVAX balances locally."
keywords: "avalanche portfolio tracker, avax wallet tracker, avalanche c-chain tracker, avax balance tracker"
features:
  - "AVAX native balance tracking on Avalanche C-Chain."
  - "Multi-account - track multiple Avalanche addresses in one place."
limitations:
  - "Avalanche support is balance-only - token balances, transaction decoding, and DeFi protocol modules are not currently available on this chain."
  - "X-Chain (UTXO) and P-Chain (staking) are not tracked."
setup:
  - "In rotki, open Blockchain & Accounts → Avalanche → Add address."
  - "Paste your C-Chain address."
  - "Optional: configure your preferred Avalanche RPC endpoint in Settings → RPC."
faq:
  - q: "Do my Avalanche addresses leave my machine?"
    a: "No. rotki queries the Avalanche RPC you configure directly from your computer."
  - q: "Does rotki decode my Avalanche transactions or DeFi activity?"
    a: "Not currently. The Avalanche integration tracks AVAX balances only; transaction decoding and DeFi protocol modules are not yet implemented on this chain."
  - q: "Does rotki track X-Chain or P-Chain?"
    a: "No. Only the EVM-compatible C-Chain is supported. X-Chain (UTXO) and P-Chain (staking) are not tracked."
screenshots: []
ctaPlan: free
---
