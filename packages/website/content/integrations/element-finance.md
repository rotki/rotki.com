---
slug: element-finance
label: "Element Finance"
type: protocol
image: "/img/integrations/element_finance.png"
tagline: "ELFI airdrop claim, decoded"
intro: "rotki decodes ELFI airdrop claims on Ethereum: when you claim and delegate your ELFI through Element's Council vote/locking flow, the receive is tagged as an airdrop against the Element Finance counterparty."
keywords: "element finance airdrop, elfi airdrop, element council airdrop"
features:
  - "ELFI airdrop claims via the Element Council vote/locking contract are decoded as airdrop receive events against the Element Finance counterparty."
  - "The delegation choice made when claiming (self-delegate or delegate to another address) is recorded in the event notes."
limitations:
  - "Element Finance decoding is currently scoped to the ELFI airdrop claim only. Principal Token and Yield Token activity, pool LP positions, and ongoing Council governance proposals/votes are not decoded as Element-counterparty events."
setup:
  - "In rotki, add the Ethereum address you used to claim ELFI."
  - "In rotki, open History and let the initial sync run. The ELFI airdrop claim is decoded automatically."
faq:
  - q: "Are Element Principal Tokens and Yield Tokens decoded?"
    a: "Not currently. The Element Finance decoder is limited to the ELFI airdrop claim; PT/YT positions appear as ordinary token movements rather than Element-tagged events."
  - q: "Does rotki read Element Finance activity from its own servers?"
    a: "No. rotki is a local application that talks directly to the Ethereum RPC endpoint you configure - the public default, a third-party provider, or your own node. The query goes from your computer to that endpoint without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
