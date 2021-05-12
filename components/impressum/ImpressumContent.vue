<template>
  <div :class="$style.wrapper">
    <Header>
      <template #subtitle>
        <div :class="$style.subtitle">Impressum</div>
      </template>
    </Header>

    <div :class="$style.content">
      <div :class="$style.details">
        <div :class="$style.heading">Angaben gemäß § 5 TMG</div>

        <div :class="$style.address">
          <div>Rotki Solutions GmbH</div>
          <div>Matthiasstr. 11</div>
          <div>10249 Berlin</div>
          <div>Handelsregister: HRB221065B</div>
          <div>Registergericht: Amtsgericht Charlottenburg</div>
        </div>

        <div :class="$style.subheading">Vertreten durch:</div>
        <p :class="$style.text">Eleftherios Karapetsas</p>
        <div :class="$style.heading">Kontakt</div>

        <p :class="$style.text">email: info@rotki.com</p>
        <div :class="$style.heading">EU-Streitschlichtung</div>

        <p :class="$style.text">
          Die Europäische Kommission stellt eine Plattform zur
          Online-Streitbeilegung (OS) bereit:
          <a
            :class="$style.link"
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
          >
            https://ec.europa.eu/consumers/odr
          </a>
          . Unsere E-Mail-Adresse finden Sie oben im Impressum
        </p>

        <div :class="$style.heading">
          Verbraucherstreitbeilegung/Universalschlichtungsstelle
        </div>

        <p :class="$style.text">
          Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <div :class="$style.heading">Haftung für Inhalte</div>

        <p :class="$style.text">
          Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte
          auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
          §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
          verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
          überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
          Tätigkeit hinweisen.
        </p>

        <p :class="$style.text">
          Verpflichtungen zur Entfernung oder Sperrung der Nutzung von
          Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
          Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der
          Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden
          von entsprechenden Rechtsverletzungen werden wir diese Inhalte
          umgehend entfernen
        </p>

        <div :class="$style.heading">Haftung für Links</div>

        <p :class="$style.text">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren
          Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
          fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
          verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der
          Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige
          Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar
        </p>

        <p :class="$style.text">
          Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch
          ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
          Bekanntwerden von Rechtsverletzungen werden wir derartige Links
          umgehend entfernen.
        </p>

        <div :class="$style.heading">Urheberrecht</div>

        <p :class="$style.text">
          Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
          Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
          Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
          Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
          jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
          sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
        </p>

        <p :class="$style.text">
          Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt
          wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden
          Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf
          eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
          entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen
          werden wir derartige Inhalte umgehend entfernen.
        </p>
      </div>
    </div>

    <page-footer />
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'ImpressumContent',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container mx-auto;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-align: center;
  text-transform: uppercase;
}

.heading {
  @apply font-serif text-primary2 font-medium;

  margin-top: 24px;

  @include text-size(24px, 32px);
}

.subheading {
  @apply font-serif text-primary2 font-medium;

  margin-top: 24px;

  @include text-size(16px, 24px);
}

.content {
  @apply flex-row flex items-center justify-center;

  padding-top: 56px;
  padding-bottom: 48px;
}

.link {
  @apply hover:text-shade8 text-primary;
}

.text {
  @apply font-sans text-shade11 text-justify;

  margin-top: 16px;
}

.address {
  @apply font-sans text-shade11;

  margin-top: 24px;
}

.details {
  max-width: 800px;

  @include for-size(phone-only) {
    width: 96%;
  }
}
</style>
