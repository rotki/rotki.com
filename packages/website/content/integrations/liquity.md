---
slug: liquity
label: "Liquity"
type: protocol
image: "/img/integrations/liquity.svg"
tagline: "Liquity troves, stability pool, and LQTY staking, decoded locally"
intro: "rotki tracks Liquity v1 troves and Liquity v2 transactions, the Stability Pool, LQTY staking, and DSProxy-managed troves (including ones created via DefiSaver). Debts appear as liabilities in your dashboard so your net worth stays accurate."
keywords: "liquity portfolio tracker, liquity v2 tracker, lusd trove tracker, lqty staking, liquity stability pool, defisaver liquity"
features:
  - "Trove collateral, debt, borrowing fees, and liquidation events decoded for v1."
  - "Liquity v2 transactions decoded, including proxy detection and proxy-deployment transactions."
  - "Stability Pool LUSD deposits, withdrawals, and LQTY rewards tracked."
  - "LQTY staking deposits and rewards (including frontend fees) decoded."
  - "DSProxy-managed troves and their events recognised, including those created via DefiSaver."
  - "Profit tracking for your Liquity staking and Stability Pool positions."
  - "Total collateral ratio shown in the Trove section."
  - "Debts shown as liabilities in dashboard balances."
setup:
  - "In rotki, add your Ethereum address. Liquity positions are detected automatically."
  - "DSProxy-managed troves are picked up from the owner address you track."
  - "Open History and let the initial sync run. Liquity events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Liquity activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Does rotki support both Liquity v1 and v2?"
    a: "Yes. v1 troves, the Stability Pool, and LQTY staking are decoded, and Liquity v2 transactions including proxy interactions are handled."
  - q: "What if I created my trove via DefiSaver?"
    a: "rotki detects DSProxy-managed troves automatically and decodes their events, including DefiSaver-created ones."
screenshots: []
ctaPlan: free
---
