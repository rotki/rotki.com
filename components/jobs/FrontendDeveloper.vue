<template>
  <div>
    <heading>Vue.js/TypeScript Developer - Role requirements</heading>

    <paragraph>
      We are looking for a passionate Vue.js developer with excellent knowledge
      of Typescript. Your primary focus will be to assist in implementing new
      features, improving the frontend quality and performance. You will also
      assist in modularizing a monolithic Vue.js app to make it scalable and
      maintainable.
    </paragraph>

    <paragraph>
      The position requires an understanding of blockchains, DeFi protocols, and
      exchanges in order to implement features that will provide the best
      experience to our users.
    </paragraph>

    <paragraph>
      We are looking for candidates that share our values on opensource and
      privacy and are focused on building robust applications that provide value
      to our users.
    </paragraph>

    <heading subheading> Technical requirements: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>Excellent knowledge of TypeScript.</li>
        <li>Excellent knowledge of Vue.js & Vuex</li>
        <li>Experience with automated JavaScript testing (Jest, Cypress)</li>
        <li>Experience with consuming RESTful APIs</li>
        <li>
          Any experience building modular Vue.js applications with reusable
          components
        </li>
        <li>[Optional] Python backend development experience</li>
        <li>[Optional] DevOps experience</li>
      </ul>
    </paragraph>

    <heading subheading> Non-Technical requirements: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>Don’t be an asshole.</li>
        <li>Be a team player.</li>
        <li>
          Be an independent thinker and have a proactive can-do attitude. In the
          start You will be guided for most tasks and there is always going to
          be mentoring when required but the more you manage to fend off by
          yourself the smoother the whole team will work. Eventually this job is
          for an individual who is both willing and capable to take on a lot of
          responsibility and take ownership of a big part of the codebase. The
          goal is to reach a state where no hand holding will be needed.
        </li>
        <li>
          Be user-minded. The user is king. Everything we implement in Rotki, we
          do so that our end users are happy and have their problems solved.
        </li>
        <li>Have excellent English speaking skills.</li>
        <li>
          [Optional] Be located in Berlin or somewhere close. 2 other full time
          members of Rotki are here and meeting face to face is valuable.
        </li>
      </ul>
    </paragraph>

    <heading> What we can offer </heading>

    <paragraph>
      This position can be for either a half-time (50%) or a full-time (100%)
      role.
    </paragraph>

    <paragraph>
      <ul :class="$style.points">
        <li>
          WFH/Working remotely. We don’t care (as long as we meet up from time
          to time!) where you live, if you travel all the time, if you are in
          your underpants when coding etc.
        </li>
        <li>
          Flexible working hours. Nobody will count your hours. As long as the
          output is there and the result is good, we don’t care.
        </li>
        <li>
          Opportunity to work with some OGs in the Ethereum and general crypto
          space.
        </li>
        <li>
          Opportunity to learn and grow your skills in the fast moving sector of
          cryptocurrencies and decentralized finance.
        </li>
        <li>
          Opportunity to work in opensource, have your code visible and running
          at the systems of the ever-increasing Rotki userbase.
        </li>
        <li>Working on a lean and mean team without micromanagement.</li>
      </ul>
    </paragraph>

    <heading> How to apply / More Info </heading>

    <paragraph>
      Send an email to careers@rotki.com with your CV, a link to your Github
      profile and a small text about yourself and why you are interested to work
      with us on Rotki. Please include a link to a project you worked on and are
      the most proud about. Tell us why that is. If it’s opensource also include
      a link.
    </paragraph>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'FrontendDeveloper',
})
</script>

<style module>
.points {
  list-style-type: disc;
  margin-left: 32px;
}
</style>
