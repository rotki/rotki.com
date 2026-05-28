---
slug: ethereum
label: "Ethereum"
type: blockchain
image: "/img/integrations/ethereum.svg"
tagline: "Ethereum portfolio tracker that never asks for your keys"
intro: "Add your Ethereum addresses (or ENS names, or read-only watch addresses) to rotki and you get balances, full transaction history, ERC-20 holdings, NFTs, and decoded DeFi activity for every protocol rotki ships a decoder for - all queried directly from the RPC endpoint you choose."
keywords: "ethereum portfolio tracker, eth wallet tracker, ethereum tax report, eth cost basis, defi pnl tracker, erc20 tracker, ens portfolio"
features:
  - "ETH and ERC-20 balances queried per tracked address against the RPC you configure."
  - "Transaction history decoded into readable events: transfers, swaps, approvals, deposits, withdrawals, protocol interactions."
  - "Dedicated decoders for a wide range of Ethereum protocols (Aave, Curve, Uniswap, MakerDAO, Lido, Morpho, Yearn, Pendle, and many more), so activity is tagged with the right counterparty instead of appearing as raw calls."
  - "NFT tracking for ERC-721 and ERC-1155 holdings, including ENS names."
  - "Primary ENS name resolution: tracked addresses display their primary ENS name across rotki."
  - "Free-tier tracking has no address-count limit; track as many Ethereum addresses as you like."
limitations:
  - "Ethereum-validator tracking (beacon chain balances, withdrawals, MEV, block-proposal rewards) is a separate, paid feature. See the Ethereum Validators integration page for details."
setup:
  - "In rotki, open Blockchain Balances → Ethereum → Add address. Paste your address or ENS name, optionally with a label."
  - "Optional: configure your preferred Ethereum RPC endpoint in Settings (a public default is provided). Pointing rotki at your own geth/reth/erigon node is the most private and reliable setup."
  - "In rotki, open History and let the initial sync run. The first sync of a long-history wallet can take a few minutes; subsequent syncs are incremental."
faq:
  - q: "Do my Ethereum addresses leave my machine?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, your own node, or a provider like Infura/Alchemy. The query goes from your computer to that endpoint without passing through any rotki-operated server."
  - q: "Do I need to give rotki a private key or seed phrase?"
    a: "No. rotki is read-only. You only ever add public addresses or ENS names."
  - q: "Can I run rotki against my own Ethereum node?"
    a: "Yes. Point rotki at your own RPC endpoint (geth, reth, erigon, nethermind, etc.) in Settings."
  - q: "Does rotki decode my DeFi activity automatically?"
    a: "Yes. rotki ships dedicated decoders for the major Ethereum DeFi protocols, so transactions show up as readable, counterparty-tagged events instead of raw call data."
screenshots: []
ctaPlan: free
---
