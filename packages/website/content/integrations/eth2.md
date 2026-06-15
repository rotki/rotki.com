---
slug: eth2
label: "Ethereum Validators"
type: protocol
image: "/img/integrations/ethereum.svg"
tagline: "Beacon chain validators, consensus rewards, MEV, and withdrawals - tracked locally"
intro: "rotki tracks your Ethereum validators directly against the beacon chain and execution layer: balances over time, consensus PnL, withdrawals to your execution address, and execution-layer rewards split between block proposal payments and MEV. Validator data is queried from the beacon endpoint you configure; withdrawals are reconstructed from Etherscan with a Blockscout fallback."
metaDescription: "rotki tracks your Ethereum validators directly against the beacon chain and execution layer: balances over time, consensus PnL, withdrawals to your execution"
keywords: "ethereum validator tracker, beacon chain tracker, eth2 staking tracker, validator rewards, eth withdrawal tracker, validator mev tracker"
features:
  - "Add validators by index or public key; balance and status are queried from the beacon endpoint."
  - "Consensus-layer PnL computed from balance snapshots and validator exits."
  - "Beacon chain withdrawals to the execution address decoded and credited to the right validator."
  - "Execution-layer rewards split into block proposal payments and MEV payments, reported separately."
  - "Exited validators continue to display in your history with their final state, so historical PnL stays correct."
  - "Validator-related events feed the rest of rotki: tax reports, history filters, and PnL summaries treat them like any other history events."
limitations:
  - "Tracking Ethereum validators is not available on the free tier. A Basic or Advanced subscription is required, and the ETH-staking limit applied to your account scales with your tier. If the Basic and Advanced limits don't fit your setup, contact us to arrange a custom plan with a higher limit."
setup:
  - "In rotki, open Blockchain Balances → Ethereum Validators and add a validator by index or public key."
  - "Optional: configure a beacon-node endpoint in Settings if you don't want to rely on the default."
  - "In rotki, open History and let the initial sync run. Withdrawals, block proposals, MEV payments, and balance updates are populated automatically."
faq:
  - q: "Are MEV/block rewards captured separately?"
    a: "Yes. Execution-layer rewards are split into block proposal payments and MEV payments, so they are reported as two separate streams alongside consensus PnL."
  - q: "Can I track validators without tracking the withdrawal address?"
    a: "Yes. rotki resolves validators by index/public key and queries their withdrawals against the execution address even if you haven't added that address as a tracked account."
  - q: "Does rotki query the beacon chain through its own servers?"
    a: "No. rotki is a local application that talks directly to the beacon-chain endpoint you configure, plus Etherscan/Blockscout for execution-layer data. Each query goes from your computer to those endpoints without passing through any rotki-operated server."
screenshots: []
ctaPlan: basic
---
