<template>
  <page>
    <template #title> Impressum </template>
    <heading>Angaben gemäß § 5 TMG</heading>

    <div :class="$style.address">
      <div>Rotki Solutions GmbH</div>
      <div>Matthiasstr. 11</div>
      <div>10249 Berlin</div>
      <div>Handelsregister: HRB221065B</div>
      <div>Registergericht: Amtsgericht Charlottenburg</div>
    </div>

    <div :class="$style.subheading">Vertreten durch:</div>
    <paragraph>Eleftherios Karapetsas</paragraph>
    <heading>Kontakt</heading>

    <paragraph>email: info@rotki.com</paragraph>
    <heading>EU-Streitschlichtung</heading>

    <paragraph>
      Die Europäische Kommission stellt eine Plattform zur
      Online-Streitbeilegung (OS) bereit:
      <external-link no-referrer url="https://ec.europa.eu/consumers/odr" />
      . Unsere E-Mail-Adresse finden Sie oben im Impressum
    </paragraph>

    <heading> Verbraucherstreitbeilegung/Universalschlichtungsstelle </heading>

    <paragraph>
      Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor
      einer Verbraucherschlichtungsstelle teilzunehmen.
    </paragraph>

    <heading>Haftung für Inhalte</heading>

    <paragraph>
      Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf
      diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis
      10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet,
      übermittelte oder gespeicherte fremde Informationen zu überwachen oder
      nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
      hinweisen.
    </paragraph>

    <paragraph>
      Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen
      nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine
      diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer
      konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
      Rechtsverletzungen werden wir diese Inhalte umgehend entfernen
    </paragraph>

    <heading>Haftung für Links</heading>

    <paragraph>
      Unser Angebot enthält Links zu externen Websites Dritter, auf deren
      Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden
      Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten
      Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
      verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung
      auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte waren zum
      Zeitpunkt der Verlinkung nicht erkennbar
    </paragraph>

    <paragraph>
      Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch
      ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
      Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend
      entfernen.
    </paragraph>

    <heading>Urheberrecht</heading>

    <paragraph>
      Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen
      Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung,
      Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen
      des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
      Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den
      privaten, nicht kommerziellen Gebrauch gestattet.
    </paragraph>

    <paragraph>
      Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden,
      werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte
      Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine
      Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
      entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden
      wir derartige Inhalte umgehend entfernen.
    </paragraph>
  </page>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'ImpressumContent',
})
</script>

<style lang="scss" module>
@import '~assets/css/media.scss';
@import '~assets/css/main.scss';

.subheading {
  @apply font-serif text-primary2 font-medium font-bold;

  margin-top: 24px;

  @include text-size(16px, 24px);
}

.address {
  @apply font-sans text-shade11;

  margin-top: 24px;
}
</style>
