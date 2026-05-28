---
slug: ens
label: "ENS"
type: protocol
image: "/img/integrations/ens.svg"
tagline: "ENS registrations, renewals, resolver changes, and ENS airdrop, decoded"
intro: "rotki decodes the full lifecycle of an ENS name on Ethereum: registration and renewal (with the ETH cost), .eth name transfers, resolver and owner changes, addr/content-hash/text-record updates on the public resolver, and the original ENS governance-token airdrop claim. Tracked addresses also display their primary ENS name across the app, and ENS expirations show up as reminders in rotki's calendar."
keywords: "ens portfolio tracker, ethereum name service tracker, ens registration tracker, ens renewal tracker, ens airdrop claim, ens calendar reminder"
features:
  - "Name registration: the NameRegistered event is decoded with the ETH paid, and the ETH spend is linked to the ENS counterparty."
  - "Name renewal: the NameRenewed event is decoded with the ETH paid for the renewal."
  - ".eth name transfers (ERC-721) are recognised against the ENS counterparty."
  - "Resolver changes (NewResolver), owner changes / subnode creation (NewOwner), and addr-changed records on the public resolver are decoded."
  - "Content-hash updates on the public resolver decoded with the codec (ipfs, swarm, etc.) and value."
  - "TextChanged records on the public resolver decoded for both key-only and key+value event variants."
  - "ENS airdrop claims decoded as airdrop receive events against the ENS counterparty."
  - "Primary ENS name resolution: tracked Ethereum addresses display their primary ENS name across the app."
  - "ENS expiration reminders are added to rotki's calendar so you can renew before names lapse."
limitations:
  - "ENS registry/registrar/resolver decoding ships for Ethereum mainnet. ENS L2 deployments are not yet covered by the ENS-counterparty decoder, though the generic ENS resolver code is shared between mainnet and other chain implementations like Basenames."
setup:
  - "In rotki, add the Ethereum address you used to register, renew, or claim ENS."
  - "In rotki, open History and let the initial sync run. Registrations, renewals, resolver changes, and the airdrop claim are decoded automatically; primary-name resolution and calendar reminders update in the background."
faq:
  - q: "Are ENS renewal costs reflected in my history?"
    a: "Yes. The NameRenewed event is decoded with the ETH paid, so the renewal cost is captured."
  - q: "Are ENS expirations surfaced anywhere?"
    a: "Yes. rotki adds an ENS-expiration entry to its calendar so you get a reminder before the name lapses."
  - q: "Was the ENS airdrop captured?"
    a: "Yes. ENS airdrop claims are decoded as airdrop receive events against the ENS counterparty."
  - q: "Does rotki resolve ENS through its own servers?"
    a: "No. rotki is a local application: ENS resolution and event decoding go directly from your computer to the Ethereum RPC endpoint you configure (the public default, a third-party provider, or your own node), without passing through any rotki-operated server."
screenshots: []
ctaPlan: free
---
