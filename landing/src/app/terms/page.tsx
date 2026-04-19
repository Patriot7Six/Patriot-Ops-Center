import type { Metadata } from 'next'
import { LegalShell } from '@/components/LegalShell'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing your use of Patriot Ops Center.',
}

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" lastUpdated="January 21, 2026">

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User,&quot;
          &quot;you,&quot; or &quot;your&quot;) and Patriot 7Six LLC, doing business as Patriot Ops Center (&quot;Company,&quot;
          &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), governing your access to and use of the Patriot Ops Center website,
          mobile application, and related services (collectively, the &quot;Service&quot;).
        </p>
        <p className="mt-4">
          By accessing or using the Service, you agree to be bound by these Terms. If you do not
          agree to these Terms, you may not access or use the Service. If you are using the Service
          on behalf of an organization, you represent and warrant that you have the authority to
          bind that organization to these Terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
        <p>To use the Service, you must:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Be at least 18 years of age;</li>
          <li>Be capable of forming a binding contract with the Company;</li>
          <li>Not be prohibited from using the Service under applicable law;</li>
          <li>For features requiring military service verification, be a current or former member of the United States Armed Forces or have a legitimate need to access such features.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">3. Description of Service</h2>
        <p>
          Patriot Ops Center is an AI-powered veteran platform designed to assist military veterans
          with VA benefits navigation, claims support, and civilian career transition. Our Service includes:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-white">Benefits Navigator:</strong> AI-guided discovery of VA benefits you&apos;ve earned based on your service.</li>
          <li><strong className="text-white">Claims Copilot:</strong> Walkthrough for filing and tracking VA disability and benefits claims.</li>
          <li><strong className="text-white">Document Processing:</strong> AI-powered extraction and analysis of DD214 forms and other military documents.</li>
          <li><strong className="text-white">MOS Translation:</strong> Conversion of Military Occupational Specialties to equivalent civilian job titles and skills.</li>
          <li><strong className="text-white">Resume Generation:</strong> AI-assisted creation of ATS-optimized resumes tailored to civilian job markets.</li>
          <li><strong className="text-white">Job Matching:</strong> Personalized job recommendations based on your skills, experience, and preferences.</li>
          <li><strong className="text-white">Career Resources:</strong> Educational content, interview coaching, and tools to support your transition.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">4. Account Registration</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">4.1 Account Creation</h3>
        <p>
          To access certain features of the Service, you must create an account. You agree to provide
          accurate, current, and complete information during registration and to update such information
          to keep it accurate, current, and complete.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">4.2 Account Security</h3>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activities that occur under your account. You agree to notify us immediately of any
          unauthorized access to or use of your account.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">4.3 Account Termination</h3>
        <p>
          We reserve the right to suspend or terminate your account at any time for any reason,
          including but not limited to violation of these Terms. You may terminate your account
          at any time by contacting us at{' '}
          <a href="mailto:support@patriot-ops.com" className="text-gold-500 hover:text-gold-400">support@patriot-ops.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">5. Subscription Plans and Payment</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">5.1 Free and Premium Services</h3>
        <p>
          We offer both free and premium subscription tiers. Benefits Navigator, Claims Copilot,
          and the 1-Year Transition Timeline are permanently free for every veteran. Employment tools
          are offered on a freemium basis with additional capabilities available under premium tiers.
          The features available under each tier are described on our website and may change from time to time.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">5.2 Payment Terms</h3>
        <p>
          For premium subscriptions, you agree to pay all applicable fees as described at the time
          of purchase. All payments are processed through our third-party payment processor. Fees
          are non-refundable except as required by law or as expressly stated in these Terms.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">5.3 Automatic Renewal</h3>
        <p>
          Premium subscriptions automatically renew at the end of each billing period unless you
          cancel before the renewal date. You may cancel your subscription at any time through your
          account settings.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">5.4 Price Changes</h3>
        <p>
          We reserve the right to change our subscription fees upon reasonable notice. Price changes
          will take effect at the start of your next billing period following the notice.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">5.5 Refund Policy</h3>
        <p>
          If you are not satisfied with your premium subscription, you may request a refund within
          14 days of your initial purchase or renewal. Refund requests should be sent to{' '}
          <a href="mailto:support@patriot-ops.com" className="text-gold-500 hover:text-gold-400">support@patriot-ops.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">6. User Content and Conduct</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.1 User Content</h3>
        <p>
          You retain ownership of all content you submit to the Service, including documents, resumes,
          and other materials (&quot;User Content&quot;). By submitting User Content, you grant us a limited,
          non-exclusive, royalty-free license to use, process, and store your User Content solely for
          the purpose of providing the Service to you.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.2 Accuracy of Information</h3>
        <p>
          You represent and warrant that all information you provide is accurate and truthful. You
          are solely responsible for ensuring that documents you upload (including DD214 forms) belong
          to you and that you have the right to provide them.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.3 Prohibited Conduct</h3>
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Use the Service for any unlawful purpose or in violation of any applicable laws;</li>
          <li>Upload fraudulent, falsified, or stolen documents;</li>
          <li>Impersonate any person or entity or misrepresent your affiliation;</li>
          <li>Attempt to gain unauthorized access to the Service or other users&apos; accounts;</li>
          <li>Interfere with or disrupt the Service or servers or networks connected to the Service;</li>
          <li>Use automated systems or software to extract data from the Service (scraping);</li>
          <li>Reverse engineer, decompile, or disassemble any aspect of the Service;</li>
          <li>Use the Service to transmit malware or other harmful code;</li>
          <li>Violate the intellectual property rights of others.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">7.1 Company Intellectual Property</h3>
        <p>
          The Service and its original content, features, and functionality are owned by Patriot 7Six LLC
          and are protected by international copyright, trademark, patent, trade secret, and other
          intellectual property laws. Our trademarks, including &quot;Patriot Ops Center&quot; and associated
          logos, may not be used without our prior written consent.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">7.2 License to Use Service</h3>
        <p>
          Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable
          license to access and use the Service for your personal, non-commercial use.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">7.3 Feedback</h3>
        <p>
          If you provide us with feedback, suggestions, or ideas about the Service, you grant us the
          right to use such feedback without restriction or compensation to you.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">8. AI-Generated Content Disclaimer</h2>
        <p>
          Our Service uses artificial intelligence to process documents, assess benefits eligibility,
          generate resumes, and provide career recommendations. You acknowledge and agree that:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>AI-generated content may contain errors, inaccuracies, or omissions and should be reviewed and verified before use;</li>
          <li>You are responsible for reviewing and approving all AI-generated resumes and other content before submitting them to employers;</li>
          <li>Benefits eligibility information is guidance only and does not constitute legal advice or a guarantee of VA determinations;</li>
          <li>Job recommendations are based on available data and algorithms and do not guarantee employment or suitability;</li>
          <li>MOS translations are approximations and may not perfectly reflect your specific skills and experience;</li>
          <li>We do not guarantee the accuracy, completeness, or reliability of any AI-generated content.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">9. Third-Party Services</h2>
        <p>
          The Service may contain links to or integrate with third-party websites, services, or job
          listings. We are not responsible for the content, terms, or practices of any third party.
          Your interactions with third parties, including employers, are solely between you and
          that third party.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimers</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">10.1 &quot;As Is&quot; Basis</h3>
        <p className="uppercase text-sm">
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT WARRANTIES OF ANY
          KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">10.2 No Employment Guarantee</h3>
        <p>
          We do not guarantee that use of the Service will result in employment, interviews, or any
          particular outcome. Career success depends on many factors beyond our control.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">10.3 No Professional Advice</h3>
        <p>
          The Service does not provide legal, financial, medical, or professional career counseling.
          Information provided through the Service, including benefits and claims guidance, is for
          general informational purposes only and should not be relied upon as professional advice.
          For legal advice regarding VA claims, consult a VA-accredited attorney or claims agent.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
        <p className="uppercase text-sm">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PATRIOT 7SIX LLC, ITS
          OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS,
          DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR RELATED TO YOUR ACCESS
          TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE SERVICE.
        </p>
        <p className="mt-4 uppercase text-sm">
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO
          THE SERVICE EXCEED THE AMOUNT YOU HAVE PAID US IN THE TWELVE (12) MONTHS PRECEDING THE
          CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">12. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Patriot 7Six LLC and its officers, directors,
          employees, agents, and affiliates from and against any and all claims, liabilities, damages,
          losses, and expenses (including reasonable attorneys&apos; fees) arising out of or related to:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>Your access to or use of the Service;</li>
          <li>Your violation of these Terms;</li>
          <li>Your violation of any third-party rights, including intellectual property rights;</li>
          <li>Any User Content you submit to the Service;</li>
          <li>Your fraudulent or illegal conduct.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">13. Dispute Resolution</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">13.1 Governing Law</h3>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State of
          Texas, without regard to its conflict of law provisions.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">13.2 Arbitration Agreement</h3>
        <p>
          Any dispute arising out of or relating to these Terms or the Service shall be resolved by
          binding arbitration administered by the American Arbitration Association in accordance with
          its Consumer Arbitration Rules. The arbitration shall take place in Austin, Texas, unless
          otherwise agreed by the parties. Judgment on the arbitration award may be entered in any
          court having jurisdiction.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">13.3 Class Action Waiver</h3>
        <p className="uppercase text-sm">
          YOU AND THE COMPANY AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS
          INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR
          REPRESENTATIVE PROCEEDING.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">13.4 Exceptions</h3>
        <p>
          Notwithstanding the foregoing, either party may seek injunctive or other equitable relief
          in any court of competent jurisdiction to prevent the actual or threatened infringement or
          misappropriation of intellectual property rights.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">14. General Provisions</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.1 Entire Agreement</h3>
        <p>
          These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire
          agreement between you and the Company regarding the Service and supersede all prior
          agreements and understandings.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.2 Severability</h3>
        <p>
          If any provision of these Terms is found to be unenforceable, the remaining provisions
          shall remain in full force and effect.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.3 Waiver</h3>
        <p>
          Our failure to enforce any right or provision of these Terms shall not constitute a waiver
          of such right or provision.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.4 Assignment</h3>
        <p>
          You may not assign or transfer these Terms or your rights hereunder without our prior
          written consent. We may assign our rights and obligations without restriction.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.5 Notices</h3>
        <p>
          We may provide notices to you via email, posting on the Service, or other reasonable means.
          You may provide notices to us at the contact information below.
        </p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">14.6 Force Majeure</h3>
        <p>
          We shall not be liable for any failure or delay in performing our obligations due to causes
          beyond our reasonable control, including natural disasters, war, terrorism, riots, embargoes,
          acts of civil or military authorities, fire, floods, accidents, or strikes.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">15. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will provide notice of material
          changes by posting the updated Terms on this page and updating the &quot;Last Updated&quot; date.
          Your continued use of the Service after any changes constitutes your acceptance of the
          revised Terms.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">16. Contact Information</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <div className="mt-4 p-6 bg-navy-900/60 border border-navy-700 rounded-lg">
          <p className="font-semibold text-white">Patriot 7Six LLC</p>
          <p className="text-navy-400">d/b/a Patriot Ops Center</p>
          <p className="mt-2">5900 Balcones Drive #28228</p>
          <p>Austin, TX 78731</p>
          <p>United States</p>
          <p className="mt-2">
            Email:{' '}
            <a href="mailto:support@patriot-ops.com" className="text-gold-500 hover:text-gold-400">support@patriot-ops.com</a>
          </p>
        </div>
      </section>

    </LegalShell>
  )
}
