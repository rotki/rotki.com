---
slug: aerodrome-finance
label: "Aerodrome Finance"
type: protocol
image: "/img/integrations/aerodrome.png"
tagline: "Aerodrome portfolio tracker - Base's ve(3,3) DEX, decoded"
intro: "rotki decodes Aerodrome swaps, LP positions, gauge rewards, and veAERO voting on Base, including fee claims via Aerodrome's fee addresses."
metaDescription: "rotki decodes Aerodrome swaps, LP positions, gauge rewards, and veAERO voting on Base, including fee claims via Aerodrome's fee addresses."
keywords: "aerodrome portfolio tracker, aero defi tracker, base dex tracker, aerodrome lp, veaero tracker"
features:
  - "Swaps and LP positions on Base."
  - "Gauge deposits, withdrawals, and reward claims decoded as discrete events."
  - "Gauge fee and bribe claims tracked via Aerodrome's fee and bribe distributor addresses."
  - "veAERO - vote-escrow lock creation, increases, voting, and unlocks decoded as their own events."
setup:
  - "In rotki, add your Base address. Aerodrome activity is decoded automatically."
  - "Optional: refresh Aerodrome's pool/gauge data under Settings → Manage Data → Refresh protocol data."
  - "Open History → wait for the initial sync to complete. Protocol events appear once your transactions are decoded."
faq:
  - q: "Do my Aerodrome positions or addresses leave my machine?"
    a: "No. rotki reads activity from the Base RPC you configure directly from your computer."
  - q: "Are Aerodrome fee claims captured?"
    a: "Yes. rotki tracks Aerodrome's gauge fee and bribe distributor addresses so claim events are decoded as separate income events."
screenshots: []
ctaPlan: free
---
