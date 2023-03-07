<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Privacy Policy </template>

    <TextParagraph>
      Rotki Solutions GmbH operates the Rotki website and Premium API
      subscription, henceforth known as the SERVICE.
    </TextParagraph>

    <TextParagraph>
      This page is used to inform website visitors regarding our policies with
      the collection, use, and disclosure of Personal Information if anyone
      decided to use our Service.
    </TextParagraph>

    <TextParagraph>
      If you choose to use our Service, then you agree to the collection and use
      of information in relation with this policy. The Personal Information that
      we collect are only used for invoicing and compliance reasons. We will not
      use or share your information with anyone except as described in this
      Privacy Policy.
    </TextParagraph>

    <TextParagraph>
      The terms used in this Privacy Policy have the same meanings as in our
      Terms and Conditions, which is accessible
      <ExternalLink same-tab text="here" url="/tos" />
      , unless otherwise defined in this Privacy Policy.
    </TextParagraph>

    <TextHeading>Information Collection and Use</TextHeading>

    <TextParagraph>
      For a better experience while using our Service, we may require you to
      provide us with certain personally identifiable information, including but
      not limited to your name and postal address. The information that we
      collect will be used solely to contact or identify you for payment
      purposes.
    </TextParagraph>

    <TextHeading>Log Data</TextHeading>

    <TextParagraph>
      We want to inform you that whenever you visit our Service, we collect
      information that your browser sends to us that is called Log Data. This
      Log Data may include information such as your computer’s Internet Protocol
      (“IP”) address, browser version, pages of our Service that you visit, the
      time and date of your visit, the time spent on those pages, and other
      statistics.
    </TextParagraph>

    <TextHeading> Cookies </TextHeading>

    <TextParagraph>
      Cookies are files with small amount of data that is commonly used as an
      anonymous unique identifier. These are sent to your browser from the
      website that you visit and are stored on your computer’s hard drive.
    </TextParagraph>

    <TextParagraph>
      Our website uses these “cookies” to collect information and to improve our
      Service. You have the option to either accept or refuse these cookies, and
      know when a cookie is being sent to your computer.
    </TextParagraph>

    <TextHeading>Service Providers</TextHeading>

    <TextParagraph>
      We may employ third-party companies and individuals due to the following
      reasons:
    </TextParagraph>

    <TextParagraph>
      <ul :class="css.list">
        <li>To facilitate our Service;</li>
        <li>To provide the Service on our behalf;</li>
        <li>To perform Service-related services; or</li>
        <li>To assist us in analyzing how our Service is used.</li>
      </ul>
    </TextParagraph>

    <TextParagraph>
      We want to inform our Service users that these third parties do not have
      any access to your Personal Information.
    </TextParagraph>

    <TextHeading> Security </TextHeading>

    <TextParagraph>
      We value your trust in providing us your Personal Information, thus we are
      striving to use commercially acceptable means of protecting it. But
      remember that no method of transmission over the internet, or method of
      electronic storage is 100% secure and reliable, and we cannot guarantee
      its absolute security.
    </TextParagraph>

    <TextHeading> Links to Other Sites </TextHeading>

    <TextParagraph>
      Our Service may contain links to other sites. If you click on a
      third-party link, you will be directed to that site. Note that these
      external sites are not operated by us. Therefore, we strongly advise you
      to review the Privacy Policy of these websites. We have no control over,
      and assume no responsibility for the content, privacy policies, or
      practices of any third-party sites or services.
    </TextParagraph>

    <TextHeading> Children’s Privacy </TextHeading>

    <TextParagraph>
      Our Services do not address anyone under the age of 13. We do not
      knowingly collect personal identifiable information from children under
      13. In the case we discover that a child under 13 has provided us with
      personal information, we immediately delete this from our servers. If you
      are a parent or guardian and you are aware that your child has provided us
      with personal information, please contact us so that we will be able to do
      necessary actions.
    </TextParagraph>

    <TextHeading> Changes to This Privacy Policy </TextHeading>

    <TextParagraph>
      We may update our Privacy Policy from time to time. Thus, we advise you to
      review this page periodically for any changes. We will notify you of any
      changes by posting the new Privacy Policy on this page. These changes are
      effective immediately, after they are posted on this page.
    </TextParagraph>

    <TextHeading> Contact Us </TextHeading>

    <TextParagraph>
      If you have any questions or suggestions about our Privacy Policy, do not
      hesitate to contact us.
    </TextParagraph>
  </PageContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.list {
  list-style-type: circle;
  padding-left: $mobile-margin * 2;
  color: #808080;
}
</style>
