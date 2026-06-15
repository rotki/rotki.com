---
slug: curve-fi
label: "Curve"
type: protocol
image: "/img/integrations/curve.png"
tagline: "Pools, gauges, veCRV, crvUSD, and Llama Lend, decoded"
intro: "rotki decodes your Curve activity across the EVM chains where Curve is deployed: pool swaps, deposits and withdrawals, gauge interactions, voting bribes, and the newer crvUSD and Llama Lend submodules. Locked CRV in the veCRV contract is shown in your balances."
metaDescription: "rotki decodes your Curve activity across the EVM chains where Curve is deployed: pool swaps, deposits and withdrawals, gauge interactions, voting bribes"
keywords: "curve portfolio tracker, curve fi tracker, curve gauge rewards, vecrv tracker, crv lock tracker, crvusd tracker, llama lend tracker"
features:
  - "Pool swaps (including routes via the Curve router) decoded as swap events."
  - "Deposits decoded for single-asset, dynamic-asset, and intermediate-pool flows, including add-liquidity-and-stake combinations."
  - "Withdrawals decoded for dynamic-amount and single-token withdrawals, with the source pool surfaced in the event notes."
  - "Gauge deposits, withdrawals, and reward claims tagged against the Curve counterparty."
  - "veCRV locks, increases, and lock-time extensions recognised; locked CRV balance is queried and surfaced in your portfolio."
  - "veCRV voting bribes claimed via Curve are decoded as bribe receive events."
  - "crvUSD borrow/repay activity decoded via the Curve crvUSD submodule."
  - "Llama Lend (Curve Lend) deposits, withdrawals, borrows, and repayments decoded across supported chains."
  - "Decoded on all chains Curve currently runs on: Ethereum, Arbitrum, Optimism, Base, Polygon PoS, Gnosis Chain, BNB Smart Chain, Monad, and Hyperliquid."
setup:
  - "In rotki, add the addresses you use on the chains where you interact with Curve."
  - "In rotki, open History and let the initial sync run. Pool, gauge, veCRV, crvUSD, and Llama Lend events are decoded automatically."
  - "If you've just opened a brand-new Curve position, you can refresh the Curve cache via Settings → Manage Data → Refresh protocol data (select Curve)."
faq:
  - q: "Is locked CRV (veCRV) tracked?"
    a: "Yes. Lock events are decoded and the current locked CRV balance is queried from the veCRV contract."
  - q: "Are gauge rewards captured?"
    a: "Yes. Gauge claims are decoded against the Curve counterparty as reward receive events."
  - q: "Are crvUSD and Llama Lend supported?"
    a: "Yes. crvUSD borrow/repay flows and Llama Lend deposit/withdraw/borrow/repay flows are decoded."
  - q: "Does rotki read Curve activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
