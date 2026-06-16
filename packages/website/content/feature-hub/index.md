---
intro: "rotki is the open-source, local-first crypto portfolio tracker, accounting and tax tool. These guides walk through what rotki actually does for common use cases, including importing data, tracking your portfolio privately, accounting for DeFi, and producing tax reports, and how it does all of it on your own machine."
keyTakeaways:
  - "rotki runs locally: it reads your exchanges through read-only API keys and your chains through RPC endpoints you choose, and stores everything encrypted on your own device."
  - "It is open source and auditable on GitHub, so you can verify exactly how your data is handled."
  - "A free local tier covers core portfolio tracking, accounting and tax reporting; a premium subscription unlocks higher limits and extra features."
  - "Each guide below is a practical walkthrough of one use case, with setup steps, honest limitations, and common fixes."
rotkiHighlights:
  - "Local-first: your transaction history is read and stored on your own machine, not uploaded to a vendor cloud."
  - "Open source: the entire application is auditable on GitHub, so you can verify what it does with your data."
  - "Self-custodied data: you connect exchanges with read-only API keys and query chains via your own endpoints; you never hand over your full history."
  - "On-chain decoding: rotki turns raw blockchain activity into readable events with full profit-and-loss accounting."
  - "Free local tier: core tracking, accounting and reporting work locally for free, with premium features available by subscription."
faq:
  - q: "What does rotki do?"
    a: "rotki is a local-first crypto portfolio tracker, accounting and tax tool. It pulls together your exchange and on-chain activity, tracks your portfolio, decodes DeFi and wallet history into readable events, and produces accounting and tax reports, all on your own computer."
  - q: "Is rotki really local and private?"
    a: "Yes. rotki runs as a desktop app on your machine. It reads exchanges with read-only API keys and chains via RPC endpoints you choose, and stores your data in a local database encrypted with SQLCipher (256-bit AES). By default nothing passes through rotki-operated servers."
  - q: "Is rotki free?"
    a: "rotki has a free local tier that covers core portfolio tracking, accounting and tax reporting with some limits. A premium subscription unlocks higher limits and additional features."
---

## What these guides cover

Every guide on this page focuses on one thing rotki does and walks you through it end to end: what it supports, how to set it up, what the honest limitations are, and how to fix the problems people most commonly hit.

The same idea runs through all of them: rotki is **local-first and open source**. It runs on your own computer, reads your exchange data through read-only API keys and your on-chain activity through RPC endpoints you choose, and stores everything in a local database encrypted with SQLCipher using 256-bit AES. Because the code is public, you can verify exactly how your data is handled rather than trusting a closed cloud service.

If you are comparing rotki against hosted tools like Koinly or CoinTracker, the comparison pages cover that trade-off in detail. These feature guides are about getting things done with rotki itself.
