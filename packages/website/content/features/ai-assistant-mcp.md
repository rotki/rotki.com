---
slug: ai-assistant-mcp
label: "AI assistants via MCP"
tagline: "Ask an AI assistant about your crypto portfolio through rotki's local MCP server"
intro: "rotki includes a Model Context Protocol (MCP) server, so an AI assistant such as Claude Code, OpenCode or ChatGPT can answer questions about your crypto history and balances. The server runs locally next to rotki, gives the assistant read-only access, and masks addresses, hashes and other identifiers before anything reaches it."
metaDescription: "Connect Claude, ChatGPT or OpenCode to your crypto portfolio with rotki's local MCP server. Read-only access with privacy modes that mask your identifiers."
keywords: "crypto portfolio mcp server, mcp crypto tax, ai crypto portfolio assistant, claude crypto portfolio, chatgpt crypto taxes, rotki mcp"
updatedAt: "October 2026"
docsUrl: "https://docs.rotki.com/usage-guides/mcp.html"
ctaPlan: basic
keyTakeaways:
  - "rotki runs an MCP server on your own machine, so an AI assistant can query your history events and balances."
  - "Access is read-only: the assistant can look things up and run read-only queries, but it cannot change your data or move funds."
  - "Privacy modes decide what the assistant sees. The default masks addresses, transaction hashes and the account names you chose."
  - "MCP is included in the Basic and Advanced plans."
capabilities:
  - "Exposes your history events and, on request, your balances to the assistant as privacy-filtered tables it can query with read-only SQL."
  - "Explains rotki's event types and subtypes to the assistant, so it reads trades, fees, staking rewards and transfers correctly."
  - "Looks up asset details and historical prices, so the assistant can value events at the time they happened."
  - "Works with MCP clients such as Claude Code and OpenCode on the same machine, and with ChatGPT through OpenAI's Secure MCP Tunnel."
  - "Runs in the desktop app and in the Docker image, where clients authenticate with a bearer token you generate in rotki."
limitations:
  - "The assistant's provider receives whatever passes the privacy filter. Only connect assistants and providers you trust, and keep the default or strict mode unless you have a reason not to."
  - "Answers are only as good as your rotki data and the assistant's reasoning. Check figures that matter, such as tax numbers, against rotki's own reports."
  - "The server listens on your own computer only. Assistants that cannot reach a local endpoint, like ChatGPT on the web, need a tunnel."
  - "MCP is not part of the free or Supporter plans; their settings show an upgrade notice and the tools return an error."
setup:
  - "In rotki, open Settings > MCP and start the server. You can also have it start automatically with rotki."
  - "Pick a privacy mode. Balanced is the default; strict also masks every label and all free text."
  - "Copy the endpoint shown in the settings, usually http://127.0.0.1:4445/mcp for the desktop app."
  - "Add that endpoint to your assistant, for example with `claude mcp add --scope user --transport http rotki http://127.0.0.1:4445/mcp` in Claude Code."
  - "On Docker, generate a bearer token in the MCP settings and add it to your client as an Authorization header."
troubleshooting:
  - problem: "The MCP settings show an upgrade notice instead of a start button."
    fix: "Your current plan does not include MCP. It needs the Basic or Advanced plan, which you can check on your rotki.com account page."
  - problem: "My assistant cannot connect."
    fix: "Make sure rotki shows the server as running and use the exact endpoint it displays, with 127.0.0.1 rather than localhost for the desktop app."
  - problem: "A Docker connection suddenly returns 401."
    fix: "Bearer tokens last at most seven days. Generate a new one in rotki and update your client configuration."
  - problem: "I changed the privacy mode but the assistant still sees the old data."
    fix: "The new mode applies right away, but a connected assistant has to reload its analytics data before it can query again."
relatedFeatures:
  - slug: privacy-first-portfolio-management
    label: "Privacy-first portfolio management"
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
  - slug: defi-portfolio-tracking
    label: "DeFi portfolio tracking"
relatedComparisons:
  - slug: koinly
    label: "rotki vs Koinly"
  - slug: cointracker
    label: "rotki vs CoinTracker"
faq:
  - q: "What is MCP?"
    a: "The Model Context Protocol is an open standard that lets AI assistants call tools and read data from other applications. rotki's MCP server is one of those tools: it lets an assistant query your rotki data."
  - q: "Which AI assistants work with rotki?"
    a: "Any client that supports MCP over HTTP. The rotki docs walk through Claude Code, OpenCode and ChatGPT, which connects through OpenAI's Secure MCP Tunnel."
  - q: "Does my financial data leave my computer?"
    a: "rotki itself never sends your financial data to rotki servers. When you connect an assistant, the data it queries goes to that assistant's provider after rotki's privacy filter has masked identifiers. In balanced mode, addresses, transaction hashes and the account names you chose are masked; in strict mode all labels and free text are masked too."
  - q: "Can the assistant change my data or move funds?"
    a: "No. The MCP server only offers read-only tools. It cannot edit your history, change settings or send transactions."
  - q: "Which plan do I need?"
    a: "MCP is included in the Basic and Advanced plans. It is not part of the free app or the Supporter plan."
---

Most of the questions people ask about their crypto are simple to state and slow to answer: how much did I spend on gas last year, which protocols did I use most, what are my largest holdings today. rotki already has the data to answer them. With its MCP server, you can ask an AI assistant instead of building the query yourself.

## How it works

The Model Context Protocol is an open standard for connecting AI assistants to tools. rotki runs an MCP server on your own computer, next to the app. When you connect an assistant to it, the assistant can list the tables rotki offers, read their columns, and run read-only SQL against your history events and balances. It can also look up asset details and historical prices, and ask rotki what each event type means, so a swap, a fee and a staking reward are read the way rotki reads them.

Nothing about this is write access. The tools only read, so the assistant cannot edit events, change settings or send transactions.

## What the assistant sees

Privacy is the reason rotki runs locally in the first place, so the MCP server filters data before it reaches the assistant. You choose how much to mask:

- **Strict** masks addresses, hashes, account names and all free text. It keeps amounts, assets, dates, counterparties and locations, which is usually all an analysis needs.
- **Balanced**, the default, masks addresses, transaction hashes and the account names you chose, but keeps rotki's generated event descriptions and the venue name of exchange accounts.
- **Raw** masks nothing. You have to opt into it explicitly, and it is only meant for an assistant and provider you trust with your full history.

In strict mode, identifiers become anonymous hashes that stay the same within a session, so the assistant can still group events by account without knowing which account it is. The settings page shows an example of what the assistant receives in each mode.

## Getting set up

Open Settings > MCP in rotki, start the server, pick a privacy mode and copy the endpoint. Then add it to your assistant. For Claude Code that is one command; OpenCode takes a short config entry; ChatGPT connects through OpenAI's Secure MCP Tunnel because it cannot reach a local address directly. If you run rotki in Docker, generate a bearer token in the same settings page and give it to your client.

MCP is part of the Basic and Advanced plans. The rotki documentation has step-by-step instructions for each assistant.
