---
slug: uniswap
label: "Uniswap"
type: protocol
image: "/img/integrations/uniswap.svg"
tagline: "Uniswap v2, v3, and v4 swaps and LP, decoded locally"
intro: "rotki decodes Uniswap v2, v3, and v4 swaps and liquidity-provider positions across the EVM chains where Uniswap is deployed. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes Uniswap v2, v3, and v4 swaps and liquidity-provider positions across the EVM chains where Uniswap is deployed."
keywords: "uniswap portfolio tracker, uniswap v4 tracker, uniswap v3 lp tracker, uniswap defi tax, uniswap swap history"
features:
  - "Uniswap v2 swaps and LP positions decoded across supported EVM chains."
  - "Uniswap v3 swaps and concentrated-liquidity positions decoded with the correct base and quote sides."
  - "Uniswap v4 swaps and LP balances decoded, including native ETH fees paid via internal transactions."
  - "LP position values reflected in your portfolio."
setup:
  - "In rotki, add your address under a chain where you've used Uniswap (Ethereum, Arbitrum, Optimism, Base, Polygon, and more)."
  - "Open History and let the initial sync run. Uniswap activity is decoded automatically."
faq:
  - q: "Which RPC does rotki use for Uniswap activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Does rotki support Uniswap v4?"
    a: "Yes. Uniswap v4 swaps and LP balances are decoded, including native ETH fees paid through internal transactions."
  - q: "Do v3 concentrated-liquidity positions show up in my portfolio?"
    a: "Yes. v3 LP positions are decoded and their values flow into your portfolio totals."
screenshots: []
ctaPlan: free
---
