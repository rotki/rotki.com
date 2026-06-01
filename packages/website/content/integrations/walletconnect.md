---
slug: walletconnect
label: "WalletConnect"
type: protocol
image: "/img/integrations/walletconnect.svg"
tagline: "WalletConnect (WCT) airdrop, staking, and rewards, decoded locally"
intro: "rotki decodes WalletConnect (WCT) activity on Optimism: airdrop claims, staking deposits, stake-weight changes, and reward claims, and detects WCT staked balances. rotki also lets you connect a wallet via WalletConnect to switch chains from the on-chain page. You choose which Optimism RPC endpoint handles the queries."
keywords: "walletconnect portfolio tracker, wct airdrop, wct staking tracker, wct rewards, reown wct tracker"
features:
  - "WCT airdrop claims decoded as airdrop income on Optimism."
  - "WCT staking deposits and stake-weight changes decoded as protocol events."
  - "WCT staking reward claims decoded as income."
  - "WCT staked balances detected for tracked addresses."
setup:
  - "In rotki, add your Optimism address."
  - "Open History and let the initial sync run. WCT events are decoded automatically."
faq:
  - q: "Which Optimism RPC does rotki use for WalletConnect activity?"
    a: "rotki is a local application that talks directly to the Optimism RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Was the WCT airdrop captured?"
    a: "Yes. WCT airdrop claims on Optimism are decoded as airdrop income."
  - q: "Are WCT staking rewards tracked?"
    a: "Yes. Reward claim events are decoded as income, and staked balances are detected."
screenshots: []
ctaPlan: free
---
