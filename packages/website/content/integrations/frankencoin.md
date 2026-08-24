---
slug: frankencoin
label: "Frankencoin"
type: protocol
image: "/img/integrations/frankencoin.svg"
tagline: "Frankencoin (ZCHF) activity and savings positions"
intro: "rotki decodes your Frankencoin activity - ZCHF movements and the savings module's deposits, withdrawals, and accrued interest - on all six EVM chains where Frankencoin is deployed."
metaDescription: "rotki decodes Frankencoin ZCHF activity and savings deposits, withdrawals, and interest across the six EVM chains Frankencoin is deployed on."
keywords: "Frankencoin portfolio tracker, ZCHF tracker, Frankencoin savings, Frankencoin accounting, Frankencoin tax"
features:
  - "Frankencoin decoders on Ethereum, Arbitrum One, Base, Optimism, Polygon PoS, and Gnosis."
  - "Savings module events decoded identically on every supported chain: deposits into savings, withdrawals, and interest accrued on your ZCHF."
  - "Savings balances read from each chain's savings contract, so your saved ZCHF and its accrued interest show up in your portfolio."
  - "Interest is recorded as its own event type, so it lands in the profit and loss report as income rather than as an unexplained receive."
limitations:
  - "The integration covers ZCHF and the savings module. Frankencoin's collateralized minting positions and its equity (FPS) pool are not decoded as Frankencoin-counterparty events."
setup:
  - "In rotki, open Blockchain Balances and add the address holding your ZCHF on the relevant chain."
  - "Open History and let the transaction sync run. Frankencoin savings deposits, withdrawals, and interest are decoded automatically."
  - "Open Balances → Blockchain to see your savings position."
faq:
  - q: "Which chains is Frankencoin tracked on?"
    a: "Ethereum, Arbitrum One, Base, Optimism, Polygon PoS, and Gnosis. rotki reads each chain's own ZCHF and savings contract deployment."
  - q: "Is the interest I earn on ZCHF reported as income?"
    a: "Yes. Savings interest is decoded as an interest event, so it is treated as income in the profit and loss report instead of an ordinary token receive."
  - q: "Are minting positions tracked?"
    a: "Not currently. The Frankencoin integration covers ZCHF itself and the savings module; collateralized minting positions are not decoded as Frankencoin events."
screenshots: []
ctaPlan: free
---
