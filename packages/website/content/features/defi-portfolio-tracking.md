---
slug: defi-portfolio-tracking
label: "DeFi portfolio tracking"
tagline: "DeFi portfolio tracking with on-chain activity decoded into readable events"
intro: "rotki tracks your DeFi portfolio by reading your on-chain activity and decoding it into readable events with full profit-and-loss accounting. It runs locally and queries chains through endpoints you choose, so you can follow swaps, liquidity positions, staking and rewards across multiple networks from one app."
metaDescription: "rotki is a local-first DeFi portfolio tracker. It decodes on-chain swaps, LP, staking and rewards into readable events with PnL across multiple chains."
keywords: "defi portfolio tracker, defi portfolio tracking, track defi positions, on-chain portfolio tracker, defi pnl tracker, multi-chain defi tracker"
updatedAt: "June 2026"
docsUrl: "https://docs.rotki.com/usage-guides/history/events.html"
ctaPlan: free
keyTakeaways:
  - "rotki decodes raw on-chain transactions into readable events instead of leaving you with hashes."
  - "It accounts for DeFi swaps, transfers, liquidity and rewards with profit-and-loss."
  - "It tracks activity across multiple EVM chains and other supported networks from one local app."
  - "You choose the RPC endpoints or data providers used to read chain data, so you control who sees those queries."
capabilities:
  - "Reads your wallet activity across supported chains and decodes it into categorised, readable events."
  - "Accounts for DeFi actions such as swaps, transfers, liquidity provision and rewards, with profit-and-loss."
  - "Tracks balances and positions across multiple networks in a single view."
  - "Lets you choose your own RPC endpoints or data providers for chain queries."
  - "Stores the decoded history in a local encrypted database you control."
limitations:
  - "DeFi is broad; decoding coverage for specific protocols varies, and some niche or brand-new protocols may need manual handling."
  - "Reading chain data depends on the RPC endpoint or data provider you configure, and public endpoints can rate-limit large histories."
  - "Complex or unusual on-chain transactions may need a manual review to be categorised correctly."
setup:
  - "Install the rotki desktop app and create a local account."
  - "Add your public wallet addresses for each chain you use."
  - "Choose the RPC endpoints or data providers rotki should use to read chain data."
  - "Let rotki pull and decode your transaction history into events."
  - "Review the decoded positions and events, correcting any that need a manual touch."
troubleshooting:
  - problem: "Some DeFi transactions are not decoded or are categorised generically."
    fix: "Decoding coverage varies by protocol. For transactions rotki cannot fully classify, open the event and set the correct type manually. Many protocols are supported out of the box and coverage continues to expand."
  - problem: "Pulling my history is slow or fails partway."
    fix: "This usually comes down to the RPC endpoint or data provider. Large histories can hit public-endpoint rate limits, so configure a more capable endpoint or your own node, then retry the query."
relatedIntegrations:
  - slug: uniswap
    label: "Uniswap"
  - slug: aave
    label: "Aave"
  - slug: ethereum
    label: "Ethereum"
  - slug: arbitrum-one
    label: "Arbitrum One"
relatedComparisons:
  - slug: koinly
    label: "rotki vs Koinly"
  - slug: cointracker
    label: "rotki vs CoinTracker"
relatedFeatures:
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
  - slug: privacy-first-portfolio-management
    label: "Privacy-first portfolio management"
faq:
  - q: "Can rotki track my DeFi portfolio?"
    a: "Yes. rotki reads your on-chain activity and decodes it into readable events such as swaps, transfers, liquidity and rewards, with profit-and-loss accounting, across multiple supported chains, all processed locally."
  - q: "Does rotki support multiple chains?"
    a: "Yes. rotki tracks activity across multiple EVM chains and other supported networks. You add your addresses and choose which endpoints to query for each chain."
  - q: "Which chains does rotki support?"
    a: "rotki covers several EVM chains, including Ethereum, Arbitrum One, Base, Optimism, Polygon PoS, Gnosis, BNB Smart Chain, Scroll, Avalanche and zkSync Lite, plus non-EVM networks such as Bitcoin, Solana, Polkadot and Kusama. The integrations directory lists the current set."
  - q: "Who sees my on-chain queries?"
    a: "rotki reads chain data through an RPC endpoint or data provider that you configure. Because you choose the endpoint, you control who sees those requests: a provider you trust or your own node."
  - q: "What if a protocol is not decoded?"
    a: "Coverage varies by protocol and keeps expanding. For transactions rotki cannot fully classify, you can open the event and set the correct type manually."
---

DeFi is where many portfolio trackers fall short: a block explorer shows you hashes, not what actually happened. rotki turns that raw on-chain activity into a portfolio you can read, and it does so locally, with endpoints you control.

## From raw transactions to readable events

rotki reads the activity for the addresses you add and decodes each transaction into a categorised event: a swap, a deposit into a liquidity pool, a staking reward, a transfer. Those events carry the accounting through to profit and loss, so your DeFi history is both visible and properly accounted for.

## You choose how chains are read

To read on-chain data, rotki queries an RPC endpoint or data provider. You decide which one, whether a public provider, a service you trust, or your own node, so you control who sees those requests and how much throughput you get for large histories. Decoded results are stored in your local encrypted database.

## Which chains rotki covers

rotki tracks activity across several EVM chains, including Ethereum, Arbitrum One, Base, Optimism, Polygon PoS, Gnosis, BNB Smart Chain, Scroll, Avalanche and zkSync Lite, alongside non-EVM networks such as Bitcoin, Solana, Polkadot and Kusama. The supported set grows over time; the [integrations directory](/integrations) lists every chain, exchange and protocol rotki currently reads.

## Protocol coverage

New DeFi protocols appear constantly, and decoding coverage for specific protocols varies; brand-new or niche protocols may need a manual review to categorise. Many protocols are supported out of the box and coverage keeps growing, and where rotki needs a hand you can correct an event yourself. The result is a multi-chain DeFi portfolio you can follow clearly, tracked privately on your own machine.
