<template>
  <div>
    <TextHeading>Vue.js/TypeScript Developer - Role requirements</TextHeading>

    <TextHeading secondary> What is rotki?</TextHeading>

    <TextParagraph>
      Rotki helps manage accounts and blockchain transactions. It’s local-first,
      privacy focused and all open source. We are long time contributors to the
      Ethereum ecosystem and general crypto space. In order to support more
      blockchains (Cosmos, Roll Ups, etc.), and to continue to ship new features
      we need the help of a Vue.js/Typescript developer. Our project is open
      source, so feel free to take a look at our codebase here:

      <ExternalLink url="https://github.com/rotki/rotki">
        https://github.com/rotki/rotki
      </ExternalLink>
    </TextParagraph>

    <TextHeading secondary> How your work with us will look like?</TextHeading>

    <TextParagraph>
      We are looking for a passionate Vue.js developer with excellent knowledge
      of Typescript. Your primary focus will be to assist in implementing new
      features, improving the frontend quality and performance. You will also
      assist in modularizing a monolithic Vue.js app to make it scalable and
      maintainable. The position requires an understanding of blockchains, DeFi
      protocols, and exchanges in order to implement features that will provide
      the best experience to our users. We are looking for candidates that share
      our values on opensource and privacy and are focused on building robust
      applications that provide value to our users.
    </TextParagraph>

    <TextHeading secondary> Technical requirements:</TextHeading>

    <TextParagraph>
      <ul :class="css.points">
        <li>Excellent knowledge of TypeScript.</li>
        <li>Excellent knowledge of Vue.js & Vuex (or pinia)</li>
        <li>
          Experience with automated JavaScript testing (Jest, vitest, Cypress)
        </li>
        <li>Experience with consuming RESTful APIs</li>
        <li>
          Any experience building modular Vue.js applications with reusable
          components
        </li>
      </ul>
    </TextParagraph>

    <TextHeading secondary> Bonus points:</TextHeading>

    <TextParagraph>
      <ul :class="css.points">
        <li>Python backend development experience</li>
        <li>DevOps experience</li>
      </ul>
    </TextParagraph>

    <TextHeading secondary> Non-technical bonus points:</TextHeading>

    <TextParagraph>
      <ul :class="css.points">
        <li>
          4 hours daily overlap with European working hours 1000 CET - 1800 CET
          for smoother teamwork
        </li>
        <li>The ability to work independently and as a part of a team</li>
        <li>
          Proactive can-do attitude and self-confidence to propose new solutions
          and take charge in their execution.
        </li>
        <li>Customer-oriented approach.</li>
        <li>Excellent English speaking skills.</li>
        <li>
          Located in Berlin or somewhere close. 2 other full time members of
          Rotki are here and meeting face to face is valuable.
        </li>
      </ul>
    </TextParagraph>

    <TextHeading secondary>What we offer:</TextHeading>

    <TextParagraph>
      <ul :class="css.points">
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
          etc) upon passed probation period
        </li>
      </ul>
    </TextParagraph>

    <TextHeading secondary> Apply </TextHeading>

    <TextParagraph>
      Send your CV, a link to your GitHub profile and a cover letter to
      careers@rotki.com. In the cover letter tell us what you think of rotki’s
      codebase and include a link to a project you worked on and are most proud
      about and tell us why.
    </TextParagraph>

    <TextParagraph>
      If you have any questions hit us up on discord:
      <ExternalLink url="https://discord.gg/aGCxHG7" no-ref>
        https://discord.gg/aGCxHG7
      </ExternalLink>
    </TextParagraph>
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style module>
.points {
  list-style-type: disc;
  margin-left: 32px;
}
</style>
