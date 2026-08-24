---
slug: solana-staking
label: "Solana staking"
type: protocol
image: "/img/integrations/solana.svg"
tagline: "Native Solana stake accounts, decoded"
intro: "rotki decodes native Solana staking from the stake program: stake accounts created and delegated, deactivated, split, merged, withdrawn, and re-authorized - each turned into a readable event on your Solana address."
metaDescription: "rotki decodes native Solana staking: stake accounts created, delegated, deactivated, split, merged, withdrawn, and re-authorized."
keywords: "Solana staking tracker, SOL staking tax, Solana stake account tracker, Solana staking accounting"
features:
  - "Stake account initialization and delegation decoded, so SOL moving into a stake account is recorded as staking rather than as a transfer to an unknown address."
  - "Deactivation and withdrawal decoded, so unstaked SOL returning to your wallet is tied back to the stake account it came from."
  - "Stake account housekeeping covered: splits, merges, moves of stake or lamports between accounts, authority changes, and lockup changes."
  - "Events are tagged with Solana staking as the counterparty, so they can be filtered and carried into the profit and loss report."
limitations:
  - "This covers native staking through Solana's stake program. Liquid staking tokens are separate protocols and are not decoded as Solana staking events."
  - "Instructions with no user-visible effect on a tracked account - such as querying the minimum delegation or deactivating a delinquent stake - are intentionally not turned into events."
setup:
  - "In rotki, open Blockchain Balances → Solana and add your address."
  - "Open History and let the transaction sync run. Stake account activity is decoded automatically."
faq:
  - q: "Are my staking rewards tracked?"
    a: "Rewards accrue inside the stake account and land in your wallet when you withdraw. rotki decodes the withdrawal against the stake account, so the SOL is accounted for when it moves."
  - q: "Is liquid staking covered by this?"
    a: "No. This integration is native staking through Solana's stake program. Liquid staking tokens have their own protocols and are not tagged as Solana staking."
  - q: "Where do the Solana queries go?"
    a: "rotki runs locally and talks directly to the Solana RPC endpoint you configure - the public default, a third-party provider, or your own node. Nothing passes through a rotki-operated server."
screenshots: []
ctaPlan: free
---
