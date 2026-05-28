---
slug: eigenlayer
label: "EigenLayer"
type: protocol
image: "/img/integrations/eigenlayer.png"
tagline: "LST and native restaking, AVS rewards, and EIGEN airdrops, decoded"
intro: "rotki decodes your EigenLayer activity on Ethereum: LST deposits into strategies, operator delegation, queued and completed withdrawals, native restaking via EigenPods, AVS reward claims, and EIGEN airdrop claims."
keywords: "eigenlayer portfolio tracker, eigenlayer restaking tracker, eigen airdrop, avs rewards, eigenpod tracker, native restaking"
features:
  - "LST deposits into EigenLayer strategies tagged against the EigenLayer counterparty."
  - "Operator delegation and undelegation events recorded with operator addresses in the notes."
  - "Withdrawals queued and withdrawals completed decoded as separate events so the in-flight balance is visible until completion."
  - "Native restaking via EigenPods: start-checkpoint, finalize-checkpoint, and validator-balance-updated events decoded."
  - "AVS reward claims via the EigenLayer Rewards Coordinator tagged as reward receive events."
  - "EIGEN airdrop claims decoded for Season 1 Phase 1, Season 1 Phase 2, and Season 2 distributors."
  - "EigenLayer balance query covers strategy deposits, queued withdrawals, and EigenPod-held ETH."
limitations:
  - "EigenLayer decoding is currently Ethereum-only; other-chain deployments are not yet covered."
  - "If an operator forcibly undelegates a staker, rotki only sees that event if the staker's address is tracked when the transaction is queried."
setup:
  - "In rotki, add the Ethereum address you use with EigenLayer (the staker address, not the EigenPod proxy)."
  - "In rotki, open History and let the initial sync run. Deposits, delegations, withdrawals, checkpoints, AVS reward claims, and EIGEN airdrop claims are decoded automatically."
faq:
  - q: "Are AVS rewards tracked?"
    a: "Yes. Claims via the EigenLayer Rewards Coordinator are tagged as reward subtype receives against the EigenLayer counterparty."
  - q: "Was the EIGEN airdrop captured?"
    a: "Yes. Season 1 Phase 1, Season 1 Phase 2, and Season 2 EIGEN airdrop claims are decoded against the EigenLayer counterparty."
  - q: "Does rotki read EigenLayer activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
