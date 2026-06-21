import { LegalLayout } from "@/components/legal-layout";
import { useDocumentHead } from "@/hooks/use-document-head";

export function Terms() {
  useDocumentHead({
    title: "Terms of Service",
    description: "Terms of Service for ShadowGuard, the shadow IT detection tool for Google Workspace and Microsoft 365 by Micro SaaS.",
  });
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="ShadowGuard — Shadow IT Detector for Google Workspace & Microsoft 365"
      lastUpdated="21 June 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service ("Terms") govern your access to and use of <strong>ShadowGuard</strong>{" "}
        (the "Service"), provided by <strong>Micro SaaS</strong> (Filippo Piconese, sole proprietor,
        "we", "us"). By connecting your Google Workspace or Microsoft 365 tenant, or otherwise using
        the Service, you ("Customer", "you") agree to these Terms on behalf of your organisation. If
        you do not have the authority to bind your organisation, you must not use the Service.
      </p>

      <h2>2. The Service</h2>
      <p>
        ShadowGuard connects to your Google Workspace (via Google's OAuth and Admin SDK APIs) or your
        Microsoft 365 tenant (via Microsoft Entra ID and the Microsoft Graph API) to discover the
        third-party OAuth applications your users have authorised and to score them by risk. The
        Service requests <strong>read-only</strong> access and cannot modify your workspace or tenant.
      </p>

      <h2>3. Eligibility &amp; Authorisation</h2>
      <ul>
        <li>You must be a <strong>super administrator</strong> of the Google Workspace, or a{" "}
        <strong>global administrator</strong> of the Microsoft 365 tenant, that you connect — or duly
        authorised to act on its behalf.</li>
        <li>You represent and warrant that you have the necessary authority and that connecting
        ShadowGuard complies with your organisation's policies and all applicable laws.</li>
        <li>You are solely responsible for obtaining any internal approvals, consents, or data
        protection impact assessments required by your organisation before connecting the Service.</li>
      </ul>

      <h2>4. Launch Period &amp; Pricing</h2>
      <p>
        During the current launch period the Service is provided <strong>free of charge</strong> with
        full features and no payment method required. The Service during this period is provided on a{" "}
        <strong>"beta" / early-access basis</strong> and may contain bugs, incomplete features, or
        experience downtime. We intend to introduce paid plans in the future; early adopters who
        connect during the launch period will keep their access as described in our launch offer.
        Pricing, plans and feature allocation may change; we will give at least <strong>30 days'
        written notice</strong> (via the email address associated with your account) of material
        pricing changes.
      </p>

      <h2>5. Acceptable Use</h2>
      <ul>
        <li>Do not use the Service to access workspaces or tenants you are not authorised to
        administer.</li>
        <li>Do not attempt to disrupt, reverse engineer, decompile, disassemble, or circumvent the
        security of the Service.</li>
        <li>Do not use the Service in violation of applicable laws or of Google's or Microsoft's
        terms.</li>
        <li>Do not use the Service to compete with or benchmark against ShadowGuard without our prior
        written consent.</li>
        <li>Do not resell, sublicense, or distribute access to the Service to third parties.</li>
      </ul>

      <h2>6. Intellectual Property</h2>
      <p>
        All rights, title and interest in and to the Service — including its software, algorithms,
        user interface, documentation, trademarks and trade secrets — are and remain the exclusive
        property of Micro SaaS. These Terms grant you no right to our intellectual property except
        the limited right to use the Service as described herein. You retain all rights to your data.
      </p>

      <h2>7. Google &amp; Microsoft API Services</h2>
      <p>
        Your use of Google data through ShadowGuard is also subject to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">
          Google API Services User Data Policy
        </a> (including its Limited Use requirements), and your use of Microsoft 365 data is subject to
        the{" "}
        <a href="https://learn.microsoft.com/en-us/legal/microsoft-apis/terms-of-use" target="_blank" rel="noopener">
          Microsoft APIs Terms of Use
        </a>. Our handling of this data is described in our <a href="/privacy">Privacy Policy</a>. You
        may revoke ShadowGuard's access at any time from your Google Admin console, or by removing the
        application's admin consent in Microsoft Entra ID.
      </p>

      <h2>8. Data &amp; Privacy</h2>
      <p>
        Our processing of personal data is described in the <a href="/privacy">Privacy Policy</a>, which
        forms part of these Terms. Your organisation remains the data controller for the data processed
        through the Service. Where required by applicable data protection law (including Article 28 GDPR),
        a Data Processing Agreement (DPA) is available upon request at{" "}
        <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a>.
      </p>

      <h2>9. Disclaimer of Warranties</h2>
      <p>
        THE SERVICE IS PROVIDED <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong>, WITHOUT
        WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO
        IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND
        NON-INFRINGEMENT.
      </p>
      <p>
        Without limiting the foregoing:
      </p>
      <ul>
        <li>ShadowGuard is a security <em>visibility</em> tool. It assists in discovering OAuth risks
        but <strong>does not guarantee detection of every risk, vulnerability, or unauthorized
        application</strong>. It is not a substitute for your own security program, policies, or
        professional security audits.</li>
        <li>We do not warrant that the risk scores, categories, or classifications assigned by the
        Service are complete, accurate, or suitable for any particular compliance or regulatory
        purpose.</li>
        <li>We do not warrant that the Service will be uninterrupted, error-free, or available at all
        times, particularly during the launch / beta period.</li>
        <li>We are not responsible for any actions or inactions you take (or fail to take) based on
        information provided by the Service.</li>
      </ul>

      <h2>10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:
      </p>
      <ul>
        <li>Micro SaaS shall <strong>not</strong> be liable for any indirect, incidental, special,
        consequential, or punitive damages, including but not limited to loss of data, loss of
        profits, loss of revenue, loss of business opportunity, reputational harm, or cost of
        procurement of substitute services, arising from or related to your use of (or inability to
        use) the Service, even if we have been advised of the possibility of such damages.</li>
        <li>Where the Service is provided <strong>free of charge</strong> (including during the launch
        period), our aggregate liability for all claims shall not exceed <strong>EUR 100</strong>.</li>
        <li>Where the Service is provided under a paid plan, our aggregate liability for all claims in
        any 12-month period shall not exceed the total fees paid by you to us in the 12 months
        preceding the event giving rise to the claim.</li>
        <li>We shall not be liable for any damages arising from: (a) your breach of these Terms or
        applicable law; (b) unauthorized access to your workspace or tenant not caused by our
        negligence; (c) actions of third-party providers (including Google, Microsoft, or
        infrastructure providers) such as API changes, outages, or policy modifications; (d) your
        failure to act on information provided by the Service.</li>
      </ul>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify, defend, and hold harmless Micro SaaS (Filippo Piconese) from and
        against any claims, damages, losses, liabilities, costs, and expenses (including reasonable
        legal fees) arising from or related to: (a) your use of the Service in violation of these
        Terms or applicable law; (b) your connection of a workspace or tenant you are not authorised
        to administer; (c) your organisation's processing of personal data in violation of applicable
        data protection laws; (d) any dispute between you and your end users or third parties relating
        to data discovered by the Service.
      </p>

      <h2>12. Force Majeure</h2>
      <p>
        We shall not be liable for any failure or delay in performing our obligations under these Terms
        where such failure or delay results from circumstances beyond our reasonable control, including
        but not limited to: natural disasters, acts of government, changes to third-party APIs or
        policies (including Google or Microsoft), internet or telecommunications failures,
        cyberattacks, pandemics, or infrastructure provider outages.
      </p>

      <h2>13. Termination</h2>
      <p>
        You may stop using the Service and revoke its access at any time from your Google Admin console,
        or by removing the application's admin consent in Microsoft Entra ID. We may suspend or
        terminate access immediately for breach of these Terms, for suspected unauthorized or unlawful
        use, or to comply with law. On termination, we delete your organisation's data and any stored
        tokens or tenant identifier within 30 days, as described in the Privacy Policy. Sections 6
        (Intellectual Property), 9 (Disclaimer), 10 (Limitation of Liability), 11 (Indemnification),
        and 14 (Governing Law) survive termination.
      </p>

      <h2>14. Governing Law &amp; Jurisdiction</h2>
      <p>
        These Terms are governed by and construed in accordance with the laws of Italy, without regard
        to conflict-of-laws rules. Any dispute arising out of or in connection with these Terms shall
        be submitted to the exclusive jurisdiction of the courts of the operator's place of business,
        subject to mandatory consumer protections where applicable.
      </p>

      <h2>15. Severability</h2>
      <p>
        If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of
        competent jurisdiction, the remaining provisions shall continue in full force and effect. The
        invalid provision shall be modified to the minimum extent necessary to make it valid and
        enforceable while preserving its original intent.
      </p>

      <h2>16. Entire Agreement</h2>
      <p>
        These Terms, together with the Privacy Policy and any applicable DPA, constitute the entire
        agreement between you and Micro SaaS regarding the Service and supersede all prior
        agreements, understandings, and representations.
      </p>

      <h2>17. Changes</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes by email
        at least 15 days before they take effect and revise the "Last updated" date above. Continued
        use of the Service after changes become effective constitutes acceptance of the revised Terms.
        If you do not agree to the changes, you must stop using the Service before they take effect.
      </p>

      <h2>18. Contact</h2>
      <p>
        <strong>Filippo Piconese — Micro SaaS</strong><br />
        Email: <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a><br />
        Website: <a href="https://www.micro-saas.it" target="_blank" rel="noopener">www.micro-saas.it</a>
      </p>
    </LegalLayout>
  );
}
