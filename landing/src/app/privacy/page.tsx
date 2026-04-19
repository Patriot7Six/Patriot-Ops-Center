import type { Metadata } from 'next'
import { LegalShell } from '@/components/LegalShell'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Patriot Ops Center collects, uses, and protects your information.',
}

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" lastUpdated="January 21, 2026">

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
        <p>
          Patriot 7Six LLC, doing business as Patriot Ops Center (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
          is committed to protecting the privacy and security of our users&apos; personal information.
          This Privacy Policy describes how we collect, use, disclose, and safeguard your information
          when you use our AI-powered veteran platform covering VA benefits, claims support, and career
          transition tools (the &quot;Service&quot;).
        </p>
        <p className="mt-4">
          We understand that as veterans, you are entrusting us with highly sensitive personal
          information, including military service records. We take this responsibility seriously
          and have implemented robust security measures to protect your data.
        </p>
        <p className="mt-4">
          By accessing or using our Service, you acknowledge that you have read, understood, and
          agree to be bound by this Privacy Policy. If you do not agree with the terms of this
          Privacy Policy, please do not access or use the Service.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">2.1 Information You Provide Directly</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Account Information:</strong> Name, email address, phone number, and password when you create an account.</li>
          <li><strong className="text-white">Military Service Records:</strong> DD214 forms and other discharge documentation, which may include your full name, Social Security Number, service number, dates of service, military occupational specialty (MOS), rank, awards, decorations, training records, and character of discharge.</li>
          <li><strong className="text-white">Career Information:</strong> Resume content, work history, education, skills, certifications, and career preferences.</li>
          <li><strong className="text-white">Communication Data:</strong> Messages, feedback, and correspondence you send to us.</li>
          <li><strong className="text-white">Payment Information:</strong> For premium subscriptions, payment card details are processed securely through our third-party payment processor and are not stored on our servers.</li>
        </ul>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">2.2 Information Collected Automatically</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong className="text-white">Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information.</li>
          <li><strong className="text-white">Usage Data:</strong> Pages visited, features used, time spent on the Service, click patterns, and search queries.</li>
          <li><strong className="text-white">Cookies and Tracking Technologies:</strong> We use cookies, web beacons, and similar technologies as described in our Cookie Policy.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-white">Service Delivery:</strong> To provide, maintain, and improve our AI-powered veteran tools, including Benefits Navigator, Claims Copilot, MOS Translator, and Resume Analyzer.</li>
          <li><strong className="text-white">Document Processing:</strong> To extract and analyze information from your DD214 and other documents using artificial intelligence to identify your benefits eligibility, skills, and qualifications.</li>
          <li><strong className="text-white">Personalization:</strong> To customize your experience and provide tailored benefits and career recommendations.</li>
          <li><strong className="text-white">Communications:</strong> To send you service-related notices, updates, security alerts, and support messages.</li>
          <li><strong className="text-white">Marketing:</strong> With your consent, to send promotional communications about new features, job opportunities, and veteran resources.</li>
          <li><strong className="text-white">Analytics:</strong> To understand how users interact with our Service and to improve our offerings.</li>
          <li><strong className="text-white">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
          <li><strong className="text-white">Security:</strong> To detect, prevent, and address fraud, unauthorized access, and other illegal activities.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">4. Protection of Sensitive Information</h2>
        <p>
          We recognize that DD214 documents and military service records contain highly sensitive
          personal information. We have implemented the following safeguards:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-white">Encryption:</strong> All sensitive documents are encrypted at rest using AES-256 encryption and in transit using TLS 1.3.</li>
          <li><strong className="text-white">Access Controls:</strong> Strict role-based access controls limit who can access your personal information within our organization.</li>
          <li><strong className="text-white">Data Minimization:</strong> We only extract and retain the specific information necessary to provide our services.</li>
          <li><strong className="text-white">SSN Handling:</strong> Social Security Numbers are processed for verification purposes only and are not stored in plain text. We use tokenization and hashing to protect this data.</li>
          <li><strong className="text-white">Secure Infrastructure:</strong> Our systems are hosted on SOC 2 Type II certified cloud infrastructure with regular security audits.</li>
          <li><strong className="text-white">Employee Training:</strong> All personnel with access to sensitive data undergo background checks and privacy/security training.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">5. Information Sharing and Disclosure</h2>
        <p>
          We do not sell your personal information. We may share your information in the following
          circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-white">Service Providers:</strong> With trusted third-party vendors who assist us in operating our Service (e.g., cloud hosting, payment processing, analytics), subject to confidentiality obligations.</li>
          <li><strong className="text-white">Job Matching (With Consent):</strong> If you opt in to our job matching features, we may share relevant portions of your profile with potential employers. You control what information is shared.</li>
          <li><strong className="text-white">Legal Requirements:</strong> When required by law, subpoena, or other legal process, or to protect our rights, property, or safety.</li>
          <li><strong className="text-white">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, with continued protection of your information.</li>
          <li><strong className="text-white">With Your Consent:</strong> For any other purpose disclosed to you with your explicit consent.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights and Choices</h2>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.1 Access and Portability</h3>
        <p>You have the right to request a copy of the personal information we hold about you in a structured, commonly used, and machine-readable format.</p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.2 Correction</h3>
        <p>You may update or correct your account information at any time through your account settings or by contacting us.</p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.3 Deletion</h3>
        <p>You may request deletion of your account and personal information. We will comply with your request, subject to certain exceptions (e.g., legal retention requirements). Upon deletion, your DD214 and other uploaded documents will be permanently removed from our systems.</p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.4 Marketing Opt-Out</h3>
        <p>You may opt out of marketing communications at any time by clicking the &quot;unsubscribe&quot; link in our emails or by contacting us. Note that you may still receive transactional communications.</p>

        <h3 className="text-xl font-medium text-gold-500 mt-6 mb-3">6.5 Do Not Track</h3>
        <p>Our Service does not currently respond to &quot;Do Not Track&quot; browser signals.</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">7. California Privacy Rights (CCPA)</h2>
        <p>
          If you are a California resident, you have additional rights under the California Consumer
          Privacy Act (CCPA):
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>The right to know what personal information we collect, use, and disclose about you.</li>
          <li>The right to request deletion of your personal information.</li>
          <li>The right to opt out of the sale of your personal information (we do not sell your data).</li>
          <li>The right to non-discrimination for exercising your privacy rights.</li>
        </ul>
        <p className="mt-4">
          To exercise these rights, please contact us at{' '}
          <a href="mailto:support@patriot-ops.com" className="text-gold-500 hover:text-gold-400">support@patriot-ops.com</a>.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
        <p>We retain your personal information for as long as your account is active or as needed to provide you services. Specifically:</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong className="text-white">Account Data:</strong> Retained until you delete your account.</li>
          <li><strong className="text-white">DD214 Documents:</strong> Retained only as long as necessary for processing and at your direction. You may delete uploaded documents at any time.</li>
          <li><strong className="text-white">Usage Data:</strong> Generally retained for up to 24 months for analytics purposes.</li>
          <li><strong className="text-white">Legal Compliance:</strong> Certain information may be retained longer if required by law or for legitimate business purposes.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">9. International Users</h2>
        <p>
          Our Service is operated in the United States. If you are accessing the Service from outside
          the United States, including while stationed overseas with the U.S. military, please be aware
          that your information will be transferred to, stored, and processed in the United States
          where our servers are located and our central database is operated.
        </p>
        <p className="mt-4">
          By using the Service, you consent to the transfer of your information to the United States,
          which may have different data protection laws than your country of residence.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">10. Children&apos;s Privacy</h2>
        <p>
          Our Service is not intended for individuals under the age of 18. We do not knowingly collect
          personal information from children. If we learn that we have collected personal information
          from a child under 18, we will take steps to delete such information promptly.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">11. Third-Party Links</h2>
        <p>
          Our Service may contain links to third-party websites, including job boards and employer
          sites. We are not responsible for the privacy practices of these third parties. We encourage
          you to review their privacy policies before providing any personal information.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date.
          For significant changes affecting how we handle sensitive information, we will provide
          additional notice (e.g., email notification).
        </p>
        <p className="mt-4">
          Your continued use of the Service after any changes constitutes your acceptance of the
          updated Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our
          privacy practices, please contact us at:
        </p>
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
