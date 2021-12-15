<template>
  <div>
    <heading>Python Backend Developer - Role requirements</heading>

    <paragraph>
      We are looking for a backend developer to help us improve Rotki. You will
      work mostly with the founder (Lefteris) who is the main developer working
      in the backend. The task is to help in the development of new features,
      supporting more exchanges, more blockchains, more DeFi protocols and
      solving all issues/bugs that are coming our way.
    </paragraph>

    <paragraph>
      This role is for an experienced developer
      <span :class="$style.bold">
        who can take initiative, does not need constant monitoring and can take
        on a lot of responsibility.
      </span>
      We need someone who can take ownership of a big part of rotki’s backend
      and help us get it to the next level.
    </paragraph>

    <paragraph>
      Since this is a startup you will probably wear a lot of hats and may need
      to also help with the backend/infrastructure of our website and API. The
      best fit would be someone who shares our values on opensource and privacy.
    </paragraph>

    <heading subheading> Technical requirements: </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>Excellent command of python.</li>
        <li>
          Experience in at least another programming language (Go, C/C++, Rust
          etc.).
        </li>
        <li>
          Write tests for features you code and bugs you fix. Not strict TDD,
          but also not complete absence of tests.
        </li>
        <li>
          Very Good technical understanding of Ethereum blockchain, interacting
          with it, querying it and knowing technical details of how it operates.
        </li>
        <li>
          [Optional] Similar knowledge of another blockchain protocol (e.g.
          Bitcoin, Substrate etc.).
        </li>
        <li>
          [Optional] Understanding of the frontend tech used in rotki:
          Typescript + vue.js + electron.
        </li>
        <li>
          [Optional] Good understanding of docker and generally infrastructure
          related tech pertaining to web servers.
        </li>
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
  name: 'BackendDeveloper',
})
</script>

<style module>
.bold {
  @apply font-medium;
}

.points {
  list-style-type: disc;
  margin-left: 32px;
}
</style>
