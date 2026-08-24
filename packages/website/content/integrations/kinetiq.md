---
slug: kinetiq
label: "Kinetiq"
type: protocol
image: "/img/integrations/kinetiq.svg"
tagline: "Kinetiq HYPE liquid staking and Kinetiq Earn"
intro: "rotki decodes Kinetiq liquid staking on Hyperliquid - HYPE staked for kHYPE, withdrawal requests, and Kinetiq Earn vault deposits - and values the positions, including HYPE still queued for withdrawal."
metaDescription: "rotki decodes Kinetiq HYPE liquid staking and Kinetiq Earn on Hyperliquid, and values positions including HYPE queued for withdrawal."
keywords: "Kinetiq portfolio tracker, kHYPE tracker, Hyperliquid liquid staking, Kinetiq Earn, Kinetiq accounting"
features:
  - "HYPE staked through Kinetiq's StakingManager decoded as a staking deposit, with the kHYPE you receive paired to it."
  - "Institutional partner deployments covered alongside the flagship kHYPE one, each with its own liquid staking token: Flowdesk flowHYPE, Hyperion HiHYPE, ASXN asxnHYPE, and HYLQ hylqHYPE."
  - "Kinetiq Earn decoded: deposits into the vault that mint vkHYPE, and withdrawals routed through the on-chain withdraw queue."
  - "Balances include HYPE sitting in pending withdrawal requests, read from the staking contract, so unstaking in progress is not missing from your portfolio."
limitations:
  - "Kinetiq is tracked on Hyperliquid (HyperEVM). You need a Hyperliquid address added in rotki for its activity to be decoded."
  - "Kinetiq Earn withdrawals are executed by solvers after maturity, so the request and the payout are separate events on the timeline."
setup:
  - "In rotki, open Blockchain Balances → Hyperliquid → Add address."
  - "Open History and let the transaction sync run. Kinetiq staking and Earn events are decoded automatically."
  - "Open Balances → Blockchain to see your kHYPE, vkHYPE, and pending withdrawal amounts."
faq:
  - q: "Is HYPE I have requested to unstake still counted?"
    a: "Yes. rotki reads pending withdrawal requests from the Kinetiq staking contract, so HYPE waiting in the queue is included in your balances rather than disappearing until it lands."
  - q: "Which liquid staking tokens are covered?"
    a: "kHYPE, plus the partner deployments' tokens: flowHYPE (Flowdesk), HiHYPE (Hyperion), asxnHYPE (ASXN), and hylqHYPE (HYLQ)."
  - q: "Where do the Hyperliquid queries go?"
    a: "rotki runs locally and talks directly to the Hyperliquid RPC endpoint you configure - the public default, a third-party provider, or your own node. Nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
