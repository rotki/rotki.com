---
slug: privacy-first-portfolio-management
label: "Privacy-first portfolio management"
tagline: "Privacy-first crypto portfolio management on your own machine"
intro: "rotki is a privacy-first crypto portfolio tracker. It runs as a desktop app on your own computer, reads your exchanges through read-only API keys and your wallets through endpoints you choose, and stores everything in a local database encrypted with SQLCipher. By default nothing passes through rotki-operated servers."
metaDescription: "rotki is a privacy-first crypto portfolio tracker. Track balances and history locally in an encrypted database; by default nothing goes to rotki servers."
keywords: "privacy-first portfolio management, private crypto portfolio tracker, encrypted crypto tracker, local crypto portfolio tracker, no-cloud crypto tracker"
updatedAt: "June 2026"
ctaPlan: free
keyTakeaways:
  - "rotki runs locally and stores your data in a database encrypted with SQLCipher (256-bit AES) on your own device."
  - "Exchanges are read with read-only API keys; you never hand over withdrawal access or your full history to a cloud."
  - "By default nothing passes through rotki-operated servers. Optional premium sync is zero-knowledge."
  - "It is open source, so the privacy claims can be verified in the code rather than taken on trust."
capabilities:
  - "Tracks balances and transaction history across exchanges, wallets and chains from one local app."
  - "Stores everything in a local database encrypted with SQLCipher using 256-bit AES."
  - "Connects to exchanges using read-only API keys, so rotki only reads data and cannot move funds."
  - "Offers optional premium backup and multi-device sync that is zero-knowledge: your database is encrypted on your device before upload."
  - "Is open source, so you can verify how and where your data is handled."
limitations:
  - "rotki is desktop-first; it is not a hosted web dashboard you log into from any browser."
  - "Because your data lives on your device, you are responsible for backups. Premium adds optional encrypted sync."
  - "Reading public chain data requires querying an RPC endpoint or data provider; you choose which one, which determines who sees those requests."
setup:
  - "Download and install the rotki desktop app and create a local account with a password. Your encryption key is derived from it."
  - "Add exchanges using read-only API keys with no withdrawal permissions."
  - "Add your public wallet addresses to track on-chain balances and activity."
  - "Optionally choose your own RPC endpoints or data providers for chain queries."
  - "Optionally enable premium sync for zero-knowledge encrypted backups across devices."
troubleshooting:
  - problem: "Will my API keys or data be uploaded anywhere?"
    fix: "No. rotki uses your API keys locally to read balances and trades, and stores everything in your local encrypted database. By default nothing is sent to rotki-operated servers; premium sync only uploads data already encrypted on your device."
  - problem: "I want to track a wallet without exposing my requests."
    fix: "Chain balances are read by querying an RPC endpoint or data provider. You choose which endpoint to use, so you control who sees those queries, for example a provider you trust or your own node."
relatedIntegrations:
  - slug: ethereum
    label: "Ethereum"
  - slug: kraken
    label: "Kraken"
  - slug: bitcoin
    label: "Bitcoin"
relatedComparisons:
  - slug: cointracker
    label: "rotki vs CoinTracker"
  - slug: koinly
    label: "rotki vs Koinly"
relatedFeatures:
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
  - slug: open-source-crypto-tax
    label: "Open-source crypto tax software"
faq:
  - q: "What is a privacy-first crypto portfolio tracker?"
    a: "It is a tracker that keeps your financial data under your control rather than in a vendor's cloud. rotki does this by running locally, reading exchanges with read-only API keys, and storing everything in an encrypted database on your own device."
  - q: "Does rotki store my portfolio in the cloud?"
    a: "No. By default your data stays in a local encrypted database on your machine. rotki offers optional premium sync, and even that is zero-knowledge: your database is encrypted on your device with a key derived from your password before it is uploaded, so rotki cannot read it."
  - q: "Can rotki move my funds?"
    a: "No. You connect exchanges with read-only API keys that have no withdrawal permissions, so rotki can only read balances and trades."
  - q: "How is my local data protected?"
    a: "rotki stores your data in a database encrypted with SQLCipher using 256-bit AES, with the key derived from your account password."
---

Most portfolio trackers ask you to upload your accounts and addresses to their servers. That is convenient, but it means your complete financial history lives in someone else's cloud. rotki is built the other way around: it is a privacy-first desktop application that keeps your data on your own machine.

## Where your data lives

rotki stores everything in a local database encrypted with SQLCipher using 256-bit AES, with the encryption key derived from your account password. Your balances, transactions and notes are on your device, not in a vendor account. Because rotki is open source, you can read the code that handles your data and confirm this for yourself.

## How rotki reads your accounts

Exchanges are connected with read-only API keys, so rotki can see your balances and trades but cannot withdraw. On-chain balances are read by querying chain data through an RPC endpoint or data provider that you choose, so you decide who sees those requests: a provider you trust, or your own node.

## The trade-off

A local-first tracker asks a bit more of you: you run a desktop app and you keep your own backups. In return you get ownership and privacy, plus an optional zero-knowledge sync if you want multi-device backups without giving up that control. If you would rather not hand your full portfolio to a cloud service, that is a trade worth making.
