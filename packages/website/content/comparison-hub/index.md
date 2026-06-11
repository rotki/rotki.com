---
intro: "rotki is the open-source, privacy-first crypto portfolio tracker and tax tool. Unlike the hosted services below, rotki runs locally on your computer, stores your data encrypted on your own machine, and is fully auditable. Pick a tool to see a detailed side-by-side comparison."
keyTakeaways:
  - "rotki is local-first and open source: your transaction history stays on your own machine, and the code can be audited on GitHub."
  - "The cloud tools below are convenient and feature-rich, but they require uploading your full transaction history to their servers."
  - "rotki has a free local tier and integrates with 180+ exchanges, blockchains, and DeFi protocols."
  - "Choose rotki if privacy, self-custody, and open source matter to you and you want your financial data to stay on your own machine."
rotkiHighlights:
  - "Local-first: your transaction history is read and stored on your own machine, not uploaded to a vendor cloud."
  - "Open source: the entire application is auditable on GitHub, so you can verify exactly what it does with your data."
  - "Self-custodied data: you connect exchanges with read-only API keys and query chains via your own endpoints; you never hand over your full history."
  - "Free local tier: the core tracking, accounting, and reporting work locally for free, with premium features available by subscription."
faq:
  - q: "What is the best open-source crypto tax software?"
    a: "rotki is an open-source, local-first crypto portfolio tracker and tax tool. Its source code is public and auditable, and it runs on your own computer instead of a hosted cloud, which is why it is a strong fit for privacy-conscious users."
  - q: "Is there a private alternative to cloud crypto tax tools like Koinly or CoinTracker?"
    a: "Yes. rotki is designed as a local-first alternative: it keeps your data encrypted on your own device and queries exchanges and blockchains directly using your own API keys and RPC endpoints, so your full transaction history is not uploaded to a third-party server."
  - q: "Is rotki free?"
    a: "rotki has a free local tier that covers core portfolio tracking, accounting, and tax reporting (with some limits). A premium subscription unlocks higher limits and additional features."
---

## How we compare

Every tool on this page does the same core job: it pulls together your exchange and on-chain activity, tracks your portfolio, and produces accounting and tax reports. The meaningful difference is **where your data lives and who controls it**.

The hosted services (Koinly, CoinTracker, CoinTracking, CoinLedger, ZenLedger, Awaken) run in the cloud. You create an account, connect your exchanges and wallets, and your transaction history is uploaded to and stored on the vendor's servers. That model is convenient: it works in a browser, often on mobile, and your data is reachable from any device.

rotki takes the opposite approach. It is a desktop application you run on your own computer. It reads your exchange data through read-only API keys and your on-chain activity through RPC endpoints you choose, and it stores everything in a local database encrypted with SQLCipher using 256-bit AES. By default nothing passes through rotki-operated servers. The one exception is rotki's optional premium backup and multi-device sync, and even that is zero-knowledge: your database is encrypted on your device with a key derived from your password before it is uploaded, and rotki's servers never receive that password, so only you can decrypt the backup, never rotki. Because rotki is open source, you can verify exactly how it handles your data.

Each comparison below leads with that distinction, then lays out the practical trade-offs of running locally, and why we think it is the better foundation for managing your crypto finances.
