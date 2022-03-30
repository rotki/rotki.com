<template>
  <div>
    <heading>Python Backend Developer</heading>
    <heading>What is rotki?</heading>

    <paragraph>
      Rotki helps manage accounts and blockchain transactions. It’s local-first,
      privacy focused and all open source. We are long time contributors to the
      Ethereum ecosystem and general crypto space. In order to support more
      blockchains (Cosmos, Roll Ups, etc.), and to continue to ship new features
      we need the help of a backend Python developer.
    </paragraph>

    <heading secondary>How your work with us will look like?</heading>

    <paragraph>
      You will be developing new features, supporting more exchanges, more
      blockchains, and more DeFi protocols. There is also always a lot of
      troubleshooting of user reported issues, bugs, and feature requests that
      are coming our way. You can improve our current Python backend
      implementation and help us get Rotki to the next level!
    </paragraph>

    <paragraph>
      As an open source project, we work collaboratively on our codebase on
      GitHub in a style that should be familiar to anyone who has participated
      in an OSS community before. If you haven’t — we’re happy to support you in
      defining and writing great feature descriptions, and breaking them down
      into dev tasks, and shipping them to customers around the world.
    </paragraph>

    <paragraph>
      This is an early stage open source company, so there is an opportunity to
      take on a variety of tasks beyond the app, such as the backend of the
      website, and our API.
    </paragraph>

    <heading secondary> Requirements: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>Excellent command of python.</li>
      </ul>
    </paragraph>

    <heading secondary> Bonus Points: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>
          Write tests for features you code and bugs you fix. Not strict TDD,
          but we’re always looking to increase test coverage
        </li>
        <li>
          Understanding of the frontend tech used in Rotki: Typescript + vue.js
          + electron. This role doesn’t require you to be a front end expert,
          but understanding of these technologies will help you.
        </li>
        <li>
          Experience with distributed systems: we connect to API endpoints and
          nodes for various blockchains.
        </li>
        <li>
          Understanding of Ethereum blockchain structures, nodes, and API
          endpoints
        </li>
        <li>
          Experience with any other blockchain stack — e.g. Cosmos, Substrate,
          etc.
        </li>
        <li>Sharing our values on open source, data ownership and privacy</li>
      </ul>
    </paragraph>

    <heading> Non-technical bonus points: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>
          4 hours daily overlap with European working hours 0900 CET - 1700 CET
          for smoother teamwork
        </li>
        <li>
          Can work independently, but co-operates well with other team members.
        </li>
        <li>Proactive and customer-oriented</li>
      </ul>
    </paragraph>

    <heading secondary> What we offer </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>
          A full-time position, but are open to part-time contributors as well.
          If located in Germany we can provide full employment with insurance
          and social benefits.
        </li>
        <li>
          Flexible working hours. We sync once per day, but other than that you
          decide when you work.
        </li>
        <li>Remote / WFH</li>
        <li>
          Training in the specifics of the project and guidance through the
          sector of cryptocurrencies and decentralized finance
        </li>
        <li>
          Participation in conferences and events to represent rotki and get to
          know other fascinating projects from the field (travel expenses are on
          us)
        </li>
        <li>
          Up to €2k for hardware allowance (laptop, dappnode, office equipment
          etc) after passed probation period
        </li>
        <li>
          Up to $80K/€71K for a senior full time (depending on experience)
        </li>
      </ul>
    </paragraph>

    <heading secondary> Apply </heading>

    <paragraph>
      We are looking for both senior and junior developers, so if you are coding
      in Python, don’t hesitate to apply!
    </paragraph>

    <paragraph>
      Send your CV, a link to your GitHub profile and a cover letter to
      careers@rotki.com. In the cover letter tell us what you think of rotki’s
      codebase and include a link to a project you worked on and are most proud
      about and tell us why.
    </paragraph>

    <paragraph>
      If you have any questions hit us up on Twitter (<external-link
        url="https://twitter.com/rotkiapp"
        no-referrer
        >@rotkiapp</external-link
      >)
    </paragraph>
  </div>
</template>

<script>
export default {
  name: 'BackendDeveloper',
}
</script>

<style module>
.points {
  @apply ml-8 list-disc;
}
</style>
