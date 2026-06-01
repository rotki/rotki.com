---
slug: lido-eth
label: "Lido"
type: protocol
image: "/img/integrations/lido.svg"
tagline: "Lido stETH, wstETH, and CSM bonds, decoded locally"
intro: "rotki decodes Lido staking (ETH submitted for stETH) and stETH/wstETH wrapping, tracks your stETH and wstETH balances, and reads Lido CSM (Community Staking Module) node-operator bond balances. You choose which Ethereum RPC endpoint handles the queries."
keywords: "lido portfolio tracker, steth tracker, wsteth tracker, lido csm tracker, lido staking, eth liquid staking tracker"
features:
  - "ETH submitted to Lido decoded as a staking deposit, with the stETH received recognised."
  - "stETH to wstETH wrapping and unwrapping decoded."
  - "stETH and wstETH balances tracked alongside the rest of your portfolio."
  - "Lido CSM node-operator bond balances read from the CSM accounting contract."
setup:
  - "In rotki, add your Ethereum address. stETH/wstETH balances and Lido staking events are detected automatically."
  - "Open History and let the initial sync run. Lido events are decoded automatically."
faq:
  - q: "Which Ethereum RPC does rotki use for Lido activity?"
    a: "rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Are Lido CSM bonds tracked?"
    a: "Yes. rotki reads your node-operator bond balance from the Lido CSM accounting contract."
  - q: "How are staking rewards reflected?"
    a: "Lido rewards accrue through stETH rebases, so they are reflected in your stETH balance over time and carried into your balance history."
screenshots: []
ctaPlan: free
---
