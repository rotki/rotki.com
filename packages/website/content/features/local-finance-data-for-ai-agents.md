---
slug: local-finance-data-for-ai-agents
label: "Local finance data for AI agents"
tagline: "Build AI finance tools on your local rotki data"
intro: "A dashboard or agent can be built in an afternoon. The difficult part is collecting, decoding and normalizing years of activity across chains, exchanges and protocols. rotki already does that work locally, then exposes the result through MCP for agents and a REST API for applications and scripts."
metaDescription: "Build AI finance tools on rotki's local data layer. Use read-only MCP for agents or the REST API for dashboards, scripts and applications."
keywords: "local finance data for AI agents, financial data MCP server, portfolio API, crypto data API, build AI finance tools, rotki API"
updatedAt: "November 2026"
docsUrl: "https://docs.rotki.com/usage-guides/build-on-rotki.html?utm_source=rotki.com&utm_medium=referral&utm_campaign=build-on-rotki"
ctaPlan: basic
keyTakeaways:
  - "rotki handles the slow part: importing, decoding and normalizing activity from supported chains, exchanges and protocols on the user's own machine."
  - "Use MCP when an AI agent needs to explore data and answer questions; use the REST API when your own code needs predictable endpoints."
  - "Both surfaces use the same local rotki data, so you do not need to build and operate a second financial-data pipeline."
  - "The MCP tools are read-only and privacy-filtered. The REST API is the broader application interface and follows rotki's normal limits."
capabilities:
  - "Lets an MCP client discover the available tables, inspect their schemas and run read-only SQL against normalized rotki data."
  - "Exposes history events and balances as consistent tables instead of raw, provider-specific blockchain and exchange responses."
  - "Provides asset metadata, historical prices and event semantics so an agent can interpret amounts, fees, trades, rewards and transfers."
  - "Offers the versioned REST API under `/api/1` for dashboards, automations, notebooks and other deterministic integrations."
  - "Runs locally in the desktop app or headlessly with Docker, keeping the source database under the user's control."
limitations:
  - "MCP exposes two queryable tables today: history events and balances. Use the REST API when your application needs a wider set of rotki operations."
  - "The MCP surface is read-only. An agent can inspect and analyze data, but it cannot edit events, change settings or send transactions."
  - "MCP requires the Basic or Advanced plan. REST API requests follow the normal limits of the rotki installation and plan."
  - "The MCP server is a local endpoint. A hosted assistant that cannot reach the user's machine needs a secure tunnel."
setup:
  - "Run rotki on the desktop, or start it headlessly with Docker if the data layer should stay available for another application."
  - "Import the accounts and exchanges your tool needs, then let rotki decode and normalize their history."
  - "For an agent, start the MCP server in Settings > MCP, select a privacy mode and connect the displayed `/mcp` endpoint."
  - "For scripts and applications, authenticate with rotki and call the versioned REST endpoints under `/api/1`."
  - "Start with a small query, verify the result against rotki, and then build the dashboard, report or workflow around it."
troubleshooting:
  - problem: "My agent cannot reach the MCP endpoint."
    fix: "Confirm that rotki shows the server as running and use the exact local endpoint it displays. Hosted clients need a secure tunnel because they cannot connect directly to 127.0.0.1."
  - problem: "The data I need is not in an MCP table."
    fix: "MCP currently exposes history events and balances. Check the REST API for broader application data, or keep the missing operation in your own integration layer."
  - problem: "The MCP settings show an upgrade notice."
    fix: "MCP is available with the Basic and Advanced plans. The REST API remains a separate surface and follows rotki's normal limits."
  - problem: "My totals do not match the rotki interface."
    fix: "Make sure rotki has finished querying and decoding the relevant accounts, then compare the same assets, date range and accounting assumptions before changing your query."
relatedFeatures:
  - slug: ai-assistant-mcp
    label: "AI assistants via MCP"
  - slug: local-first-crypto-accounting
    label: "Local-first crypto accounting"
  - slug: privacy-first-portfolio-management
    label: "Privacy-first portfolio management"
relatedComparisons:
  - slug: koinly
    label: "rotki vs Koinly"
  - slug: cointracker
    label: "rotki vs CoinTracker"
faq:
  - q: "Should I use MCP or the REST API?"
    a: "Use MCP when an AI agent should discover the available data, form its own read-only queries and explain the result. Use the REST API when a script or application needs deterministic endpoints and a broader interface. A product can use both."
  - q: "Does rotki send my financial data to a hosted backend?"
    a: "No. rotki collects and stores the data locally. If you connect an AI assistant, the information that assistant requests is sent to its provider after the MCP privacy filter has been applied."
  - q: "Can an agent change data or move funds through MCP?"
    a: "No. The MCP tools are read-only. They cannot edit history, change rotki settings or initiate transactions."
  - q: "Which plan includes the builder interfaces?"
    a: "MCP is included in the Basic and Advanced plans. The REST API follows rotki's normal application limits rather than the MCP plan requirement."
  - q: "Can I run rotki without the desktop interface?"
    a: "Yes. The official Docker image can run rotki headlessly, with persistent data and logs mounted from the host."
---

The visible part of a finance tool is often the quickest part to build. A chart, chat interface or scheduled report can take an afternoon. The expensive part is everything underneath it: importing activity from different sources, identifying assets, decoding transactions, assigning consistent event types and finding the right historical prices.

rotki can be that local data layer. It already turns supported blockchain accounts, exchanges and protocols into a normalized history on the user's machine. Your tool can start from that model instead of maintaining a separate collection and decoding pipeline.

## Choose the interface that matches the job

Use the **MCP server** for agents. A connected client can call `list_tables`, inspect a table with `describe_table`, and run read-only queries. It can also look up asset information, historical prices and rotki's event semantics. The result is an interface an agent can explore without giving it write access to the application.

Use the **REST API** for application code. Its versioned `/api/1` endpoints are a better fit for repeatable scripts, dashboards and automations where your code should decide exactly which operation runs and how the response is handled.

The interfaces are complementary. An application can use the REST API for its regular workflow and offer MCP alongside it for open-ended analysis.

## Keep the data layer local

rotki runs on the user's computer and stores its database there. For an always-on integration, the official Docker image provides the same data layer without the desktop interface. That gives a builder one local service to operate while the user keeps control of the underlying financial history.

MCP adds another boundary before data reaches an assistant. Its privacy modes can mask addresses, transaction hashes, account names and free text, depending on the selected level. The tools themselves are read-only.

## Start with one useful question

Connect one data source, let rotki finish decoding it, and choose a result that can be checked in the rotki interface. Ask an agent to summarize fees, or have a script fetch the data for one dashboard card. Once the numbers agree, expand the integration without having to rebuild the ingestion layer underneath it.

The [builder guide](https://docs.rotki.com/usage-guides/build-on-rotki.html?utm_source=rotki.com&utm_medium=referral&utm_campaign=build-on-rotki) explains the two interfaces and headless setup. If you are starting with an agent, the [MCP setup guide](https://docs.rotki.com/usage-guides/mcp.html?utm_source=rotki.com&utm_medium=referral&utm_campaign=build-on-rotki) has client-specific connection steps.
