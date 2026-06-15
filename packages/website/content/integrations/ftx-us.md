---
slug: ftx-us
label: "FTX US"
type: exchange
image: "/img/integrations/ftxus.svg"
tagline: "FTX US recognised as a historical location only"
intro: "FTX US wound down in November 2022 alongside its parent. rotki no longer ships an FTX US API connector or a dedicated FTX US CSV importer; FTX US is still recognised as a historical location, so events can be tagged against it, but you need to bring those events into rotki yourself."
metaDescription: "FTX US wound down in November 2022 alongside its parent. rotki no longer ships an FTX US API connector or a dedicated FTX US CSV importer; FTX US is still"
keywords: "ftx us historical records, ftx us tax report, ftx us bankruptcy records"
features:
  - "FTX US is preserved as a historical location. History events you add manually (or import via rotki's generic CSV) can be tagged as FTX US so they group with the rest of your FTX US activity."
limitations:
  - "There is no FTX US exchange connector; the FTX US API is unreachable and rotki has removed it."
  - "There is no dedicated FTX US CSV importer. If you have FTX US history saved from before the shutdown, format it into rotki's own generic CSV import (generic trades or generic events) or add the events manually."
setup:
  - "Recover or export your FTX US history (from records saved before the shutdown, or via the bankruptcy claim portal)."
  - "Format those records into rotki's generic CSV import, or add the events manually as FTX-US-tagged history events."
  - "In rotki, open Import Data and select the rotki generic trades or generic events importer."
faq:
  - q: "Can I add my FTX US API key to rotki?"
    a: "No. The FTX US API is unreachable. FTX US appears only as a historical location."
  - q: "Does rotki have a direct FTX US CSV importer?"
    a: "No. Format your FTX US history into rotki's generic CSV import (generic trades or generic events), or add the events manually."
screenshots: []
ctaPlan: free
---
