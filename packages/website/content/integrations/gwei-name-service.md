---
slug: gwei-name-service
label: "Gwei Name Service"
type: protocol
image: "/img/integrations/gns.svg"
tagline: ".gwei names resolved and registration activity decoded"
intro: "rotki resolves .gwei names to and from Ethereum addresses and decodes Gwei Name Service registrations, renewals, subdomains, and record changes into readable events."
metaDescription: "rotki resolves .gwei names both ways and decodes Gwei Name Service registrations, renewals, subdomains, and record changes."
keywords: "Gwei Name Service tracker, .gwei name resolver, GNS portfolio tracker, GNS accounting, gwei names"
features:
  - "Forward resolution: type a .gwei name where rotki accepts an address and it is resolved on-chain."
  - "Reverse resolution: tracked Ethereum addresses that have a primary .gwei name are shown by name instead of by hex, resolved in batches via multicall."
  - "Name registrations decoded as a trade, so the ETH you paid and the name you received are paired instead of appearing as two loose transfers."
  - "Renewals, subdomain registrations, primary-name changes, and text-record updates decoded as informational events on the transaction."
limitations:
  - "Gwei Name Service is an Ethereum mainnet integration. Names are not resolved against other chains."
  - "Name resolution needs an on-chain call, so it depends on the Ethereum RPC endpoint you have configured being reachable."
setup:
  - "In rotki, open Blockchain Balances → Ethereum and add your address."
  - "Open History and let the transaction sync run. Registrations, renewals, and record changes are decoded automatically."
  - "Your primary .gwei name is picked up on its own; no configuration is needed to show it in place of the address."
faq:
  - q: "Can I enter a .gwei name instead of an address?"
    a: "Yes. rotki resolves .gwei names on-chain wherever it accepts an address."
  - q: "Why does my address still show as hex?"
    a: "Reverse resolution only returns a name when the address has a valid primary .gwei name set, with the forward record pointing back at it. If either side is missing, there is no name to show."
  - q: "Is the name registration treated as a purchase?"
    a: "Yes. The ETH spent and the name received are decoded as a single trade, so the cost basis of the name is recorded rather than the payment appearing as an unexplained spend."
screenshots: []
ctaPlan: free
---
