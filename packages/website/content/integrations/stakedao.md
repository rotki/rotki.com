---
slug: stakedao
label: "StakeDAO"
type: protocol
image: "/img/integrations/stakedao.png"
tagline: "StakeDAO Curve strategies and bribe claims, decoded locally"
intro: "rotki decodes StakeDAO V2 Curve strategy transactions, detects vault balances, and decodes votemarket bribe and bounty claims. You choose which Ethereum RPC endpoint handles the queries."
keywords: "stakedao portfolio tracker, sdt tracker, votemarket tracker, stakedao bribes, stakedao curve strategy"
features:
  - "StakeDAO V2 Curve strategy transactions decoded, with vault balances detected."
  - "Votemarket bribe and bounty claims decoded as income events."
  - "Strategy withdrawals decoded."
setup:
  - "In rotki, add your Ethereum address. StakeDAO positions are detected automatically."
  - "Open History and let the initial sync run. StakeDAO events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for StakeDAO activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are votemarket bribes captured?"
    a: "Yes. Votemarket bribe and bounty claims are decoded as income events."
screenshots: []
ctaPlan: free
---
