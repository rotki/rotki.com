---
slug: aave
label: "Aave"
type: protocol
image: "/img/integrations/aave.svg"
tagline: "Aave portfolio tracker - supply, borrow, and rewards, decoded"
intro: "rotki decodes your Aave v1, v2, and v3 activity - supplies, borrows, repayments, liquidations, GHO, and AAVE rewards - across Ethereum, Arbitrum, Optimism, Polygon, Base, Gnosis, Scroll, and BNB Chain."
metaDescription: "rotki decodes your Aave v1, v2, and v3 activity - supplies, borrows, repayments, liquidations, GHO, and AAVE rewards - across Ethereum, Arbitrum, Optimism"
keywords: "aave portfolio tracker, aave defi tracker, aave tax report, aave v3 tracker, aave liquidation tracker, gho tracker"
features:
  - "Supplies and withdrawals - including v3 ETH gateway and native+wrapped-token same-transaction flows."
  - "Borrows and repayments - interest accrual events tied to your position."
  - "AAVE rewards - claim and immediate-restake patterns recognised."
  - "Liquidations - both the debt repayment and the collateral seizure are tagged as liquidation events, so realised PnL flows into your tax report."
  - "GHO - Aave's stablecoin decoded with its own dedicated handling."
  - "Multi-chain - Aave v3 across Ethereum, Arbitrum, Optimism, Polygon, Base, Gnosis, Scroll, and BNB Chain."
  - "v2 → v3 migrations - transactions routed through Aave's migration helper on Ethereum and Polygon are decoded as migrations rather than separate v2 exits and v3 entries."
limitations:
  - "Aave v4 is not yet supported. rotki currently decodes v1, v2, and v3 activity."
setup:
  - "In rotki, add your address under the chain where your Aave position lives (Blockchain & Accounts → Ethereum / Arbitrum / etc.)."
  - "rotki will detect your Aave positions automatically; no Aave-specific configuration needed."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "Do my Aave positions or addresses leave my machine?"
    a: "No. rotki reads your activity from the RPC nodes you configure directly from your computer."
  - q: "Does rotki support both Aave v2 and v3?"
    a: "Yes. Both versions are decoded, including the v2 → v3 migration flows."
  - q: "Is Aave v4 supported?"
    a: "No, Aave v4 is not yet supported. rotki currently decodes Aave v1, v2, and v3 activity."
  - q: "Are Aave liquidations handled for tax purposes?"
    a: "Yes. The debt repayment and collateral seizure are decoded as paired liquidation events, so realised PnL flows into your tax report."
screenshots: []
ctaPlan: free
---
