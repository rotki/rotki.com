---
slug: spark
label: "Spark"
type: protocol
image: "/img/integrations/spark.svg"
tagline: "Spark lending, savings, and SPK, decoded locally"
intro: "rotki decodes your Spark Protocol activity: Spark Lend supplies and borrows, Spark Savings (sDAI / sUSDS) deposits and withdrawals, the SPK airdrop claim and staking, and Spark proxy-account balances. You choose which RPC endpoint handles the queries."
metaDescription: "rotki decodes your Spark Protocol activity: Spark Lend supplies and borrows, Spark Savings (sDAI / sUSDS) deposits and withdrawals, the SPK airdrop claim"
keywords: "spark portfolio tracker, spark protocol tracker, sdai tracker, susds tracker, spk airdrop claim, spark savings tracker"
features:
  - "Spark Lend supplies, withdrawals, borrows, and repayments decoded."
  - "Spark Savings sDAI and sUSDS deposit and withdraw events decoded."
  - "SPK airdrop claims and SPK staking decoded as events."
  - "Spark proxy-account balances detected."
  - "Decoded on Ethereum, Arbitrum, Optimism, Base, and Gnosis."
setup:
  - "In rotki, add your address under a chain where your Spark activity lives. Proxy positions are detected automatically."
  - "Open History and let the initial sync run. Spark events are decoded automatically."
faq:
  - q: "Which RPC does rotki use for Spark activity?"
    a: "rotki is a local application that talks directly to the RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are sDAI and sUSDS deposits tracked?"
    a: "Yes. Spark Savings deposits and withdrawals are decoded as protocol events."
  - q: "Was the SPK airdrop captured?"
    a: "Yes. SPK airdrop claims and any subsequent staking events are decoded."
screenshots: []
ctaPlan: free
---
