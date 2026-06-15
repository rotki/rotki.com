---
slug: beefy-finance
label: "Beefy Finance"
type: protocol
image: "/img/integrations/beefy_finance_light.svg"
tagline: "Beefy Finance portfolio tracker - multi-chain yield vaults, decoded"
intro: "rotki decodes Beefy Finance vault deposits and withdrawals, reward-pool staking, harvest rewards, and legacy boost exits across Ethereum, Arbitrum, Optimism, Polygon, Base, Gnosis, Scroll, and BNB Chain."
metaDescription: "rotki decodes Beefy Finance vault deposits and withdrawals, reward-pool staking, harvest rewards, and legacy boost exits across Ethereum, Arbitrum, Optimism"
keywords: "beefy finance portfolio tracker, beefy vault tracker, beefy moo tracker, beefy defi tax"
features:
  - "Vault deposits and withdrawals decoded as deposit/withdraw events with the underlying token resolved."
  - "Reward-pool staking - depositing the moo/cow vault token for the rmoo/rcow reward-pool token (and the reverse) decoded as staking/unstaking events."
  - "Beefy staking rewards decoded as separate reward income events."
  - "Legacy boost exits - unstake-and-claim from old boost contracts decoded as a single unstake event."
  - "Vault and reward-pool tokens are auto-registered on first sight so they appear in your portfolio with correct pricing."
  - "Multi-chain - Ethereum, Arbitrum, Optimism, Polygon, Base, Gnosis, Scroll, and BNB Chain."
setup:
  - "In rotki, add your address under the chain where you use Beefy."
  - "Vault positions are detected automatically."
  - "Optional: refresh Beefy's cached vault data under Settings → Manage Data → Refresh protocol data."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "How does rotki query my Beefy activity?"
    a: "rotki is a local application that talks directly to the EVM RPC endpoint you configure for each chain - the public default, a third-party provider, or your own node. Each query goes from your computer to that endpoint without passing through any rotki-operated server or Beefy's API."
  - q: "Are Beefy boost rewards captured?"
    a: "Yes. Reward-pool staking rewards and legacy boost exits are both decoded as income/unstake events."
screenshots: []
ctaPlan: free
---
