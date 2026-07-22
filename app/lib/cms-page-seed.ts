/**
 * Default CMS page content (EN / NE / HI) with shared CSS.
 * Used on startup when the backend has no page yet, or as offline fallback.
 */

export type CmsLocaleCode = 'en' | 'ne' | 'hi';

export type CmsSeedLocale = {
  title: string;
  htmlContent: string;
};

export type CmsPageSeed = {
  name: string;
  description: string;
  cssContent: string;
  locales: Record<CmsLocaleCode, CmsSeedLocale>;
};

export const CMS_SHARED_CSS = `
.cms-wrap { display: flex; flex-direction: column; gap: 1rem; }
.cms-card {
  background: var(--naad-card-bg, #141b34);
  border: 1px solid var(--naad-line, #28314e);
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
}
.cms-card h2, .cms-card h3 {
  margin: 0 0 0.65rem;
  color: var(--naad-fg, #ffffff);
  font-family: var(--font-display, Georgia, serif);
  font-size: 1.15rem;
  font-weight: 600;
}
.cms-card p, .cms-card li {
  margin: 0;
  line-height: 1.75;
  color: var(--naad-fg-muted, #c7d2fe);
  font-size: 0.9375rem;
}
.cms-grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
.cms-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}
.cms-stat {
  text-align: center;
  padding: 1.25rem 1rem;
  background: var(--naad-card-bg, #141b34);
  border: 1px solid var(--naad-line, #28314e);
  border-radius: 12px;
}
.cms-stat strong {
  display: block;
  font-size: 1.5rem;
  color: var(--naad-accent, #f4c430);
  font-family: var(--font-display, Georgia, serif);
}
.cms-stat span {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8125rem;
  color: var(--naad-fg-muted, #c7d2fe);
}
.cms-faq-item { padding: 0.15rem 0; }
.cms-faq-q {
  font-weight: 600;
  color: var(--naad-fg, #ffffff);
  margin: 0 0 0.35rem;
}
.cms-cta {
  margin-top: 0.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--naad-primary, #5b3cc4) 0%, var(--naad-secondary, #6c63ff) 100%);
  color: #fff;
}
.cms-cta h3 { margin: 0 0 0.5rem; color: #fff; font-family: var(--font-display, Georgia, serif); }
.cms-cta p { color: rgba(255,255,255,0.92); margin: 0; line-height: 1.6; }
.cms-cta a { color: var(--naad-accent, #f4c430); font-weight: 600; }
.cms-list { margin: 0.5rem 0 0; padding-left: 1.2rem; display: grid; gap: 0.45rem; }
`.trim();

function aboutUs(): CmsPageSeed {
  return {
    name: 'about-us',
    description: 'About Naad Official',
    cssContent: CMS_SHARED_CSS,
    locales: {
      en: {
        title: 'About us',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card">
    <h2>Our story</h2>
    <p>Naad Official is a calm home for horoscope guidance, calendar tools, and personal sessions with trusted astrologers. We blend Vedic tradition with a clear modern experience so everyday decisions feel grounded.</p>
    <p>From daily readings to Bikram Sambat date conversion and live consultations, Naad Official helps you stay connected to timing, ritual, and insight.</p>
  </article>
  <div class="cms-grid-2">
    <article class="cms-card"><h3>Mission</h3><p>To make authentic astrology guidance accessible, multilingual, and easy to use for every household.</p></article>
    <article class="cms-card"><h3>Vision</h3><p>To become Nepal’s most trusted digital companion for horoscope, calendar, and spiritual consultation.</p></article>
  </div>
  <div class="cms-stats">
    <div class="cms-stat"><strong>12</strong><span>Zodiac signs</span></div>
    <div class="cms-stat"><strong>3</strong><span>Languages</span></div>
    <div class="cms-stat"><strong>A.D. ↔ B.S.</strong><span>Date tools</span></div>
    <div class="cms-stat"><strong>Live</strong><span>Astrologer meetings</span></div>
  </div>
</div>`.trim(),
      },
      ne: {
        title: 'हाम्रो बारेमा',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card">
    <h2>हाम्रो कथा</h2>
    <p>Naad Official राशिफल मार्गदर्शन, पात्रो उपकरण र भरपर्दो ज्योतिषीसँगको व्यक्तिगत सत्रका लागि शान्त घर हो। हामी वैदिक परम्परालाई स्पष्ट आधुनिक अनुभवसँग जोड्छौं।</p>
    <p>दैनिक पढाइदेखि बिक्रम सम्बत् मिति रूपान्तरण र लाइभ परामर्शसम्म, Naad Official ले समय, कर्मकाण्ड र अन्तर्दृष्टिसँग जोड्न सहयोग गर्छ।</p>
  </article>
  <div class="cms-grid-2">
    <article class="cms-card"><h3>उद्देश्य</h3><p>प्रामाणिक ज्योतिष मार्गदर्शनलाई पहुँचयोग्य, बहुभाषिक र सहज बनाउनु।</p></article>
    <article class="cms-card"><h3>दृष्टि</h3><p>राशिफल, पात्रो र आध्यात्मिक परामर्शका लागि नेपालको सबैभन्दा भरपर्दो डिजिटल साथी बन्नु।</p></article>
  </div>
  <div class="cms-stats">
    <div class="cms-stat"><strong>१२</strong><span>राशि</span></div>
    <div class="cms-stat"><strong>३</strong><span>भाषा</span></div>
    <div class="cms-stat"><strong>ई. ↔ वि.सं.</strong><span>मिति उपकरण</span></div>
    <div class="cms-stat"><strong>लाइभ</strong><span>ज्योतिष बैठक</span></div>
  </div>
</div>`.trim(),
      },
      hi: {
        title: 'हमारे बारे में',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card">
    <h2>हमारी कहानी</h2>
    <p>Naad Official राशिफल मार्गदर्शन, कैलेंडर उपकरण और विश्वसनीय ज्योतिषियों के साथ व्यक्तिगत सत्रों का शांत घर है। हम वैदिक परंपरा को स्पष्ट आधुनिक अनुभव से जोड़ते हैं।</p>
    <p>दैनिक पाठ से लेकर विक्रम संवत तिथि रूपांतरण और लाइव परामर्श तक, Naad Official समय, अनुष्ठान और अंतर्दृष्टि से जुड़ने में मदद करता है।</p>
  </article>
  <div class="cms-grid-2">
    <article class="cms-card"><h3>मिशन</h3><p>प्रामाणिक ज्योतिष मार्गदर्शन को सुलभ, बहुभाषी और आसान बनाना।</p></article>
    <article class="cms-card"><h3>दृष्टि</h3><p>राशिफल, कैलेंडर और आध्यात्मिक परामर्श के लिए नेपाल का सबसे भरोसेमंद डिजिटल साथी बनना।</p></article>
  </div>
  <div class="cms-stats">
    <div class="cms-stat"><strong>१२</strong><span>राशि</span></div>
    <div class="cms-stat"><strong>३</strong><span>भाषाएँ</span></div>
    <div class="cms-stat"><strong>ई. ↔ वि.सं.</strong><span>तिथि उपकरण</span></div>
    <div class="cms-stat"><strong>लाइव</strong><span>ज्योतिष बैठक</span></div>
  </div>
</div>`.trim(),
      },
    },
  };
}

function faq(): CmsPageSeed {
  return {
    name: 'faq',
    description: 'Frequently asked questions',
    cssContent: CMS_SHARED_CSS,
    locales: {
      en: {
        title: 'FAQ',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">What is Naad Official?</p><p>Naad Official is a digital platform for horoscope readings, A.D./B.S. date conversion, and booking meetings with astrologers.</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">Do I need an account to read horoscopes?</p><p>Public horoscope readings can be viewed without signing in. Booking an astrologer meeting requires an account.</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">Which calendars are supported?</p><p>You can convert between Gregorian (A.D.) and Bikram Sambat (B.S.) and browse either calendar month view.</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">Which languages are available?</p><p>Interface and CMS pages support English, Nepali, and Hindi where content is published.</p></article>
  <div class="cms-cta"><h3>Still have questions?</h3><p>Visit our <a href="/contact-us">Contact us</a> page and send a message to the Naad team.</p></div>
</div>`.trim(),
      },
      ne: {
        title: 'बारम्बार सोधिने प्रश्न',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">Naad Official के हो?</p><p>Naad Official राशिफल पढाइ, ई./वि.सं. मिति रूपान्तरण र ज्योतिषीसँग बैठक बुक गर्ने डिजिटल प्लेटफर्म हो।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">राशिफल पढ्न खाता चाहिन्छ?</p><p>सार्वजनिक राशिफल साइन इनबिना हेर्न सकिन्छ। ज्योतिषी बैठक बुक गर्न खाता आवश्यक छ।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">कुन पात्रो समर्थन छ?</p><p>तपाईं ग्रेगोरियन (ई.) र बिक्रम सम्बत् (वि.सं.) बीच रूपान्तरण गर्न र दुवै महिना दृश्य हेर्न सक्नुहुन्छ।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">कुन भाषा उपलब्ध छन्?</p><p>इन्टरफेस र CMS पृष्ठहरूमा अंग्रेजी, नेपाली र हिन्दी (प्रकाशित सामग्रीअनुसार) उपलब्ध छन्।</p></article>
  <div class="cms-cta"><h3>अझै प्रश्न छ?</h3><p>हाम्रो <a href="/contact-us">सम्पर्क</a> पृष्ठमा जानुहोस् र सन्देश पठाउनुहोस्।</p></div>
</div>`.trim(),
      },
      hi: {
        title: 'अक्सर पूछे जाने वाले प्रश्न',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">Naad Official क्या है?</p><p>Naad Official राशिफल पाठ, ई./वि.सं. तिथि रूपांतरण और ज्योतिषियों के साथ बैठक बुक करने का डिजिटल प्लेटफॉर्म है।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">राशिफल पढ़ने के लिए खाता चाहिए?</p><p>सार्वजनिक राशिफल बिना साइन इन देखे जा सकते हैं। ज्योतिष बैठक बुक करने के लिए खाता आवश्यक है।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">कौन से कैलेंडर समर्थित हैं?</p><p>आप ग्रेगोरियन (ई.) और विक्रम संवत (वि.सं.) के बीच रूपांतरण कर सकते हैं और दोनों मासिक दृश्य देख सकते हैं।</p></article>
  <article class="cms-card cms-faq-item"><p class="cms-faq-q">कौन सी भाषाएँ उपलब्ध हैं?</p><p>इंटरफ़ेस और CMS पृष्ठ अंग्रेज़ी, नेपाली और हिंदी (प्रकाशित सामग्री के अनुसार) समर्थित करते हैं।</p></article>
  <div class="cms-cta"><h3>और प्रश्न हैं?</h3><p>हमारे <a href="/contact-us">संपर्क</a> पृष्ठ पर जाएँ और संदेश भेजें।</p></div>
</div>`.trim(),
      },
    },
  };
}

function privacyPolicy(): CmsPageSeed {
  return {
    name: 'privacy-policy',
    description: 'Privacy policy',
    cssContent: CMS_SHARED_CSS,
    locales: {
      en: {
        title: 'Privacy policy',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>1. Introduction</h2><p>This Privacy Policy explains how Naad Official collects, uses, stores, and protects personal information when you use our website and services.</p></article>
  <article class="cms-card"><h2>2. Information we collect</h2><p>We may collect account details, contact form messages, booking information, technical usage logs, and preferences such as language and theme.</p></article>
  <article class="cms-card"><h2>3. How we use information</h2><ul class="cms-list"><li>Provide horoscope, calendar, and consultation features</li><li>Respond to support and contact requests</li><li>Improve security, reliability, and user experience</li></ul></article>
  <article class="cms-card"><h2>4. Sharing</h2><p>We do not sell personal data. We may share information with service providers who help operate the platform, or when required by law.</p></article>
  <article class="cms-card"><h2>5. Contact</h2><p>For privacy questions, email <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> or use our Contact us page.</p></article>
</div>`.trim(),
      },
      ne: {
        title: 'गोपनीयता नीति',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>१. परिचय</h2><p>यो गोपनीयता नीतिले Naad Official ले वेबसाइट र सेवा प्रयोग गर्दा व्यक्तिगत जानकारी कसरी सङ्कलन, प्रयोग, भण्डारण र सुरक्षा गर्छ भन्ने व्याख्या गर्छ।</p></article>
  <article class="cms-card"><h2>२. हामीले सङ्कलन गर्ने जानकारी</h2><p>हामी खाता विवरण, सम्पर्क फारम सन्देश, बुकिङ जानकारी, प्राविधिक उपयोग लग र भाषा/थिम जस्ता प्राथमिकता सङ्कलन गर्न सक्छौं।</p></article>
  <article class="cms-card"><h2>३. जानकारीको प्रयोग</h2><ul class="cms-list"><li>राशिफल, पात्रो र परामर्श सुविधा प्रदान गर्न</li><li>सहायता र सम्पर्क अनुरोधको जवाफ दिन</li><li>सुरक्षा, विश्वसनीयता र अनुभव सुधार गर्न</li></ul></article>
  <article class="cms-card"><h2>४. साझेदारी</h2><p>हामी व्यक्तिगत डाटा बिक्री गर्दैनौं। प्लेटफर्म सञ्चालन सहयोगी वा कानुनी आवश्यकताअनुसार मात्र साझा गर्न सकिन्छ।</p></article>
  <article class="cms-card"><h2>५. सम्पर्क</h2><p>गोपनीयता सम्बन्धी प्रश्नका लागि <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> मा इमेल गर्नुहोस् वा सम्पर्क पृष्ठ प्रयोग गर्नुहोस्।</p></article>
</div>`.trim(),
      },
      hi: {
        title: 'गोपनीयता नीति',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>१. परिचय</h2><p>यह गोपनीयता नीति बताती है कि Naad Official वेबसाइट और सेवाओं के उपयोग पर व्यक्तिगत जानकारी कैसे एकत्र, उपयोग, संग्रहीत और सुरक्षित करता है।</p></article>
  <article class="cms-card"><h2>२. हम जो जानकारी एकत्र करते हैं</h2><p>हम खाता विवरण, संपर्क फ़ॉर्म संदेश, बुकिंग जानकारी, तकनीकी उपयोग लॉग तथा भाषा/थीम जैसी प्राथमिकताएँ एकत्र कर सकते हैं।</p></article>
  <article class="cms-card"><h2>३. जानकारी का उपयोग</h2><ul class="cms-list"><li>राशिफल, कैलेंडर और परामर्श सुविधाएँ प्रदान करने के लिए</li><li>सहायता और संपर्क अनुरोधों का उत्तर देने के लिए</li><li>सुरक्षा, विश्वसनीयता और अनुभव सुधारने के लिए</li></ul></article>
  <article class="cms-card"><h2>४. साझाकरण</h2><p>हम व्यक्तिगत डेटा नहीं बेचते। प्लेटफ़ॉर्म संचालन में सहायक सेवा प्रदाताओं या कानून की आवश्यकता पर ही साझा किया जा सकता है।</p></article>
  <article class="cms-card"><h2>५. संपर्क</h2><p>गोपनीयता संबंधी प्रश्नों के लिए <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> पर ईमेल करें या संपर्क पृष्ठ का उपयोग करें।</p></article>
</div>`.trim(),
      },
    },
  };
}

function termsOfService(): CmsPageSeed {
  return {
    name: 'terms',
    description: 'Terms of service',
    cssContent: CMS_SHARED_CSS,
    locales: {
      en: {
        title: 'Terms of service',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>1. Agreement</h2><p>By creating an account or signing in with email, Google, or Facebook, you agree to these Terms of Service and our Privacy Policy.</p></article>
  <article class="cms-card"><h2>2. Accounts</h2><p>You are responsible for keeping your login credentials secure. Social login accounts must use a valid Google or Facebook identity that you control.</p></article>
  <article class="cms-card"><h2>3. Services</h2><p>Naad Official provides astrology-related content, calendars, consultations, and related tools for personal guidance. Content is not a substitute for professional legal, medical, or financial advice.</p></article>
  <article class="cms-card"><h2>4. Acceptable use</h2><ul class="cms-list"><li>Do not misuse the platform, harass others, or attempt unauthorized access</li><li>Do not share another person’s personal data without permission</li><li>Do not reverse-engineer or disrupt our services</li></ul></article>
  <article class="cms-card"><h2>5. Social sign-in</h2><p>When you continue with Google or Facebook, we receive basic profile information (such as name and email) from that provider to create or sign in to your Customer account. You can disconnect social login by contacting support.</p></article>
  <article class="cms-card"><h2>6. Changes</h2><p>We may update these terms from time to time. Continued use of the service after changes means you accept the updated terms.</p></article>
  <article class="cms-card"><h2>7. Contact</h2><p>Questions about these terms: <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> or our Contact us page.</p></article>
</div>`.trim(),
      },
      ne: {
        title: 'सेवाका सर्तहरू',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>१. सहमति</h2><p>इमेल, Google वा Facebook बाट खाता बनाउँदा वा साइन इन गर्दा तपाईं यी सेवाका सर्तहरू र हाम्रो गोपनीयता नीतिमा सहमत हुनुहुन्छ।</p></article>
  <article class="cms-card"><h2>२. खाता</h2><p>तपाईंको लगइन जानकारी सुरक्षित राख्ने जिम्मेवारी तपाईंकै हो। सामाजिक लगइनमा तपाईंले नियन्त्रण गर्ने मान्य Google वा Facebook पहिचान प्रयोग गर्नुपर्छ।</p></article>
  <article class="cms-card"><h2>३. सेवाहरू</h2><p>Naad Official ले ज्योतिष सामग्री, पात्रो, परामर्श र सम्बन्धित उपकरणहरू व्यक्तिगत मार्गदर्शनका लागि प्रदान गर्छ। यो कानुनी, चिकित्सा वा वित्तीय सल्लाहको विकल्प होइन।</p></article>
  <article class="cms-card"><h2>४. स्वीकार्य प्रयोग</h2><ul class="cms-list"><li>प्लेटफर्मको दुरुपयोग, उत्पीडन वा अनधिकृत पहुँच नगर्नुहोस्</li><li>अर्काको व्यक्तिगत डाटा अनुमतिबिना नबाँड्नुहोस्</li><li>सेवा अवरुद्ध वा रिभर्स इन्जिनियरिङ नगर्नुहोस्</li></ul></article>
  <article class="cms-card"><h2>५. सामाजिक साइन-इन</h2><p>Google वा Facebook बाट जारी राख्दा हामी Customer खाता बनाउन/साइन इन गर्न नाम र इमेल जस्ता आधारभूत प्रोफाइल जानकारी प्राप्त गर्छौं। समर्थनसँग सम्पर्क गरी सामाजिक लगइन छुट्याउन सकिन्छ।</p></article>
  <article class="cms-card"><h2>६. परिवर्तन</h2><p>हामी समय-समयमा यी सर्तहरू अद्यावधिक गर्न सक्छौं। परिवर्तनपछि सेवा प्रयोग जारी राख्नु भनेको अद्यावधिक सर्त स्वीकार गर्नु हो।</p></article>
  <article class="cms-card"><h2>७. सम्पर्क</h2><p>सर्तसम्बन्धी प्रश्न: <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> वा सम्पर्क पृष्ठ।</p></article>
</div>`.trim(),
      },
      hi: {
        title: 'सेवा की शर्तें',
        htmlContent: `
<div class="cms-wrap">
  <article class="cms-card"><h2>१. सहमति</h2><p>ईमेल, Google या Facebook से खाता बनाते या साइन इन करते समय आप इन सेवा शर्तों और हमारी गोपनीयता नीति से सहमत होते हैं।</p></article>
  <article class="cms-card"><h2>२. खाते</h2><p>आपकी लॉगिन जानकारी सुरक्षित रखना आपकी जिम्मेदारी है। सोशल लॉगिन में आपके नियंत्रण वाली मान्य Google या Facebook पहचान का उपयोग करें।</p></article>
  <article class="cms-card"><h2>३. सेवाएँ</h2><p>Naad Official ज्योतिष सामग्री, कैलेंडर, परामर्श और संबंधित उपकरण व्यक्तिगत मार्गदर्शन के लिए प्रदान करता है। यह कानूनी, चिकित्सकीय या वित्तीय सलाह का विकल्प नहीं है।</p></article>
  <article class="cms-card"><h2>४. स्वीकार्य उपयोग</h2><ul class="cms-list"><li>प्लेटफ़ॉर्म का दुरुपयोग, उत्पीड़न या अनधिकृत पहुँच न करें</li><li>बिना अनुमति किसी अन्य का व्यक्तिगत डेटा साझा न करें</li><li>सेवाओं को बाधित या रिवर्स-इंजीनियर न करें</li></ul></article>
  <article class="cms-card"><h2>५. सोशल साइन-इन</h2><p>Google या Facebook से जारी रखने पर हम Customer खाता बनाने/साइन इन के लिए नाम और ईमेल जैसी बुनियादी प्रोफ़ाइल जानकारी प्राप्त करते हैं। सहायता से संपर्क कर सोशल लॉगिन अलग किया जा सकता है।</p></article>
  <article class="cms-card"><h2>६. बदलाव</h2><p>हम समय-समय पर इन शर्तों को अपडेट कर सकते हैं। बदलाव के बाद सेवा का उपयोग जारी रखना अपडेटेड शर्तों की स्वीकृति माना जाता है।</p></article>
  <article class="cms-card"><h2>७. संपर्क</h2><p>शर्तों संबंधी प्रश्न: <a href="mailto:info@naadofficial.com">info@naadofficial.com</a> या संपर्क पृष्ठ।</p></article>
</div>`.trim(),
      },
    },
  };
}

const SEEDS: CmsPageSeed[] = [aboutUs(), faq(), privacyPolicy(), termsOfService()];

export function listCmsPageSeeds(): CmsPageSeed[] {
  return SEEDS;
}

export function normalizeCmsLocale(locale?: string | null): CmsLocaleCode {
  const code = String(locale || 'en')
    .trim()
    .toLowerCase()
    .slice(0, 2);
  if (code === 'ne' || code === 'np') return 'ne';
  if (code === 'hi') return 'hi';
  return 'en';
}

export function getCmsPageSeed(
  name: string,
  locale?: string | null
): {
  name: string;
  language: string;
  title: string;
  htmlContent: string;
  cssContent: string;
} | null {
  const seed = SEEDS.find((s) => s.name === name.trim());
  if (!seed) return null;
  const lang = normalizeCmsLocale(locale);
  const localized = seed.locales[lang] ?? seed.locales.en;
  return {
    name: seed.name,
    language: lang.toUpperCase(),
    title: localized.title,
    htmlContent: localized.htmlContent,
    cssContent: seed.cssContent,
  };
}
