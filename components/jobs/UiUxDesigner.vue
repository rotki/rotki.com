<template>
  <div>
    <heading>UI/UX Designer</heading>

    <heading secondary>What is rotki?</heading>

    <paragraph>
      Rotki is a portfolio tracker and accounting tool for crypto and more. It
      helps manage accounts, blockchain transactions, exchange integrations,
      DeFi etc. It is local-first, privacy focused and all open source. We are
      long time contributors to the Ethereum ecosystem and general crypto space.
    </paragraph>

    <paragraph>
      Rotki is built by a small team of software developers without UI/UX
      experience. You can get a feel of our application's current state from our
      <external-link
        url="https://rotki.readthedocs.io/en/latest/usage_guide.html"
        no-ref
        >user guide.
      </external-link>
    </paragraph>

    <heading secondary>What are we looking for</heading>

    <paragraph>
      We are looking for a UI/UX designer who wants to be part of our team and
      aligns with the open-source local-first application ethos, to help us
      improve our application's user experience and design.
    </paragraph>

    <paragraph>
      The position is fully remote and it can be either part-time or full-time.
    </paragraph>

    <heading secondary> What will working with us look like? </heading>

    <paragraph>
      Your primary focus will be working with the team to improve the overall
      application user experience. You will brainstorm, collect and evaluate
      user feedback, iterate and translate it to user flows, wireframes,
      prototypes and mockups that the frontend team can use for implementation.
    </paragraph>

    <paragraph>
      Your secondary focus will be defining and building a brand identity around
      our current logo (european red robin), the website ux improvement and the
      creation of promotional material, such as twitter headers and other
      graphics.
    </paragraph>

    <heading secondary> Responsibilities </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>Create and define user centric design SOPs.</li>
        <li>Define and create current and new Personas.</li>
        <li>Study and define current user flows and new ones.</li>
        <li>Collect, understand and prioritize feedback.</li>
        <li>
          Help the team to brainstorm new ideas and improve existing ones in a
          user centric way.
        </li>
        <li>Create user flows, wireframes, prototypes and mockups</li>
        <li>Creating original designs (graphics/promotional material)</li>
      </ul>
    </paragraph>

    <heading secondary> Requirements </heading>

    <paragraph>
      <ul :class="$style.points">
        <li>
          4 hours daily overlap with European working hours 0900 - 1800 CET for
          smoother teamwork
        </li>
      </ul>
    </paragraph>

    <heading secondary> Apply </heading>

    <paragraph>
      Please send us an email to careers@rotki.com along with some links to your
      portfolio and a cover letter explaining why you would like to work with
      us. If you have any questions hit us up on discord:
      <external-link url="https://discord.gg/aGCxHG7" no-ref>
        https://discord.gg/aGCxHG7
      </external-link>
    </paragraph>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'UiUxDesigner',
})
</script>

<style module>
.points {
  list-style-type: disc;
  margin-left: 32px;
}
</style>
