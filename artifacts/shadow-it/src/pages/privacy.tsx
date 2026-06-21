import { LegalLayout } from "@/components/legal-layout";
import { useDocumentHead } from "@/hooks/use-document-head";

export function Privacy() {
  useDocumentHead({
    title: "Privacy Policy",
    description: "How ShadowGuard processes personal data when your organisation connects Google Workspace or Microsoft 365. GDPR-compliant, read-only access, no content scanning.",
  });
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="ShadowGuard — Shadow IT Detector for Google Workspace & Microsoft 365"
      lastUpdated="21 June 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy describes how <strong>Micro SaaS</strong> (operated by Filippo Piconese,
        sole proprietor, "we", "us") processes personal data when your organisation connects and
        uses <strong>ShadowGuard</strong> (the "Service") at <strong>shadowit.micro-saas.it</strong>{" "}
        with your <strong>Google Workspace</strong> or <strong>Microsoft 365</strong>.
      </p>
      <p>
        ShadowGuard is a web application that connects to your Google Workspace (via Google's OAuth and
        Admin SDK APIs) or your Microsoft 365 tenant (via Microsoft Entra ID and the Microsoft Graph
        API) to discover the third-party OAuth applications your users have authorised, and to score
        them by risk. The Service runs on our own cloud infrastructure and database.
      </p>
      <div className="sg-callout">
        <strong>Key takeaway:</strong> ShadowGuard reads the <em>authorisation grants</em> in your
        workspace or tenant (which apps users connected, and the scopes granted). It <strong>never
        reads the content</strong> of your emails, files, calendars or documents.
      </div>

      <h2>2. Data Controller and Data Processor</h2>
      <p>Under the GDPR and applicable data protection laws:</p>
      <ul>
        <li><strong>Data Controller:</strong> the organisation that owns the Google Workspace or
        Microsoft 365 tenant where ShadowGuard is connected (your company). You determine the
        purposes and means of processing.</li>
        <li><strong>Data Processor:</strong> Micro SaaS (Filippo Piconese) processes data on your
        behalf, solely to provide the Service, in accordance with your instructions as implemented
        through the Service's functionality.</li>
        <li><strong>Sub-processors:</strong> the infrastructure and service providers listed in
        section 11.</li>
        <li><strong>Data Processing Agreement:</strong> where required by Article 28 GDPR, a DPA is
        available upon request at{" "}
        <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a>.</li>
      </ul>

      <h2>3. What Data We Process</h2>
      <h3>3.1 Account &amp; identity (the connecting admin)</h3>
      <ul>
        <li>Provider account identifier (Google user ID or Microsoft object ID), email address,
        display name and (where provided) profile picture</li>
        <li>Your workspace or tenant domain (e.g. <em>company.com</em>)</li>
      </ul>
      <h3>3.2 OAuth grants (the data we analyse)</h3>
      <ul>
        <li>Third-party application name and OAuth client/application ID</li>
        <li>The OAuth scopes/permissions each application was granted</li>
        <li>The email addresses of users who authorised each application, and the directory user
        roster captured at scan time</li>
        <li>Derived metadata: category, risk score, first/last seen timestamps, scan history</li>
      </ul>
      <h3>3.3 Provider access credentials</h3>
      <p>
        <strong>Google Workspace:</strong> to run scans on your behalf we store the OAuth access and
        refresh tokens issued by Google for the connected Workspace, used solely to call the Google
        Admin SDK. You can revoke them at any time from your Google Admin console, which immediately
        stops all access.
      </p>
      <p>
        <strong>Microsoft 365:</strong> we do <strong>not</strong> store per-user tokens. After an
        administrator grants admin consent, we store only your <strong>tenant identifier</strong> and
        run scans using our own application credentials (app-only access), limited to the read-only
        permissions you approved. You can revoke access at any time by removing the application's admin
        consent in Microsoft Entra ID.
      </p>
      <h3>3.4 Data we do NOT process</h3>
      <ul>
        <li>The content of emails, Drive/OneDrive/SharePoint files, documents, calendars or chats</li>
        <li>Passwords or credentials of your users</li>
        <li>Any data beyond the read-only directory and app/token-listing scopes you approve</li>
      </ul>

      <h2>4. Google &amp; Microsoft API Services — Limited Use</h2>
      <p>
        ShadowGuard's use and transfer of information received from Google APIs adheres to the{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">
          Google API Services User Data Policy
        </a>, including the <strong>Limited Use</strong> requirements. Specifically, data obtained
        from Google Workspace is used only to provide and improve the Service's user-facing features
        (discovering and risk-scoring OAuth apps); it is <strong>not</strong> sold, used for
        advertising, or used to train generalised AI/ML models, and human access is not performed
        except as permitted by that policy.
      </p>
      <p>
        Likewise, ShadowGuard's use of data received from the <strong>Microsoft Graph</strong> API
        complies with the{" "}
        <a href="https://learn.microsoft.com/en-us/legal/microsoft-apis/terms-of-use" target="_blank" rel="noopener">
          Microsoft APIs Terms of Use
        </a>: data is used only to provide the Service's features and is <strong>not</strong> sold,
        used for advertising, or used to train generalised AI/ML models.
      </p>

      <h2>5. Lawful Basis for Processing</h2>
      <ul>
        <li><strong>Contract performance (Art. 6(1)(b)):</strong> processing is necessary to provide
        the Service you connected your workspace or tenant for.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> monitoring third-party access to a
        workspace or tenant to prevent data exposure is a legitimate security interest of the
        controller. You may exercise your right to object to this processing (see section 12).</li>
      </ul>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Discovered apps, scan history and identity data are retained while your workspace or
        tenant remains connected.</li>
        <li>When you disconnect (revoke access in the Google Admin console, or remove admin consent in
        Microsoft Entra ID) or request deletion, we delete your organisation's data and any stored
        tokens or tenant identifier <strong>within 30 days</strong> of the disconnection or
        request.</li>
        <li>Anonymised, aggregated statistics (e.g. total number of scans performed) that cannot
        identify your organisation may be retained indefinitely.</li>
        <li>You can request erasure at any time by contacting us (section 13).</li>
      </ul>

      <h2>7. International Data Transfers</h2>
      <p>
        Your data may be processed in the European Union and/or the United States by our
        sub-processors (see section 11). Where personal data is transferred outside the European
        Economic Area (EEA), we rely on:
      </p>
      <ul>
        <li>The <strong>EU-U.S. Data Privacy Framework</strong> (where the recipient is certified
        under the DPF); and/or</li>
        <li><strong>Standard Contractual Clauses</strong> (SCCs) adopted by the European Commission,
        as incorporated in our agreements with sub-processors.</li>
      </ul>
      <p>
        You may request a copy of the applicable transfer safeguards by contacting us at{" "}
        <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a>.
      </p>

      <h2>8. Security Measures</h2>
      <ul>
        <li>All traffic is served over HTTPS/TLS.</li>
        <li>ShadowGuard requests only <strong>read-only</strong> permissions (Google directory scopes;
        Microsoft Graph read-only application permissions); it can never modify your workspace or
        tenant.</li>
        <li>Each customer's data is isolated per organisation; access is gated by an authenticated
        session and administrator verification.</li>
        <li>Google OAuth tokens are encrypted at rest and used solely to perform scans; for Microsoft
        we store only the tenant identifier. Access is restricted to automated scan processes.</li>
        <li>We maintain appropriate technical and organisational measures to protect personal data
        against accidental or unlawful destruction, loss, alteration, or unauthorised disclosure.</li>
      </ul>

      <h2>9. Data Breach Notification</h2>
      <p>
        In the event of a personal data breach that is likely to result in a risk to the rights and
        freedoms of natural persons, we will:
      </p>
      <ul>
        <li>Notify the affected data controller (your organisation) <strong>without undue delay and in
        any event within 72 hours</strong> of becoming aware of the breach, in accordance with
        Article 33 GDPR.</li>
        <li>Provide sufficient information to enable you to fulfil your own notification obligations
        to supervisory authorities and data subjects (Article 34 GDPR).</li>
        <li>Cooperate with you and take reasonable steps to mitigate the effects of the breach.</li>
      </ul>

      <h2>10. Cookies and Tracking</h2>
      <p>
        ShadowGuard uses a single essential session cookie to keep you signed in. We do not use
        advertising or third-party analytics trackers.
      </p>

      <h2>11. Sub-Processors</h2>
      <table>
        <thead>
          <tr><th>Sub-processor</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          <tr><td>Railway</td><td>Application hosting &amp; managed PostgreSQL database</td><td>EU / US</td></tr>
          <tr><td>Google LLC</td><td>Identity (OAuth) &amp; Google Workspace data source (Admin SDK)</td><td>EU / US</td></tr>
          <tr><td>Microsoft Corporation</td><td>Identity (Entra ID) &amp; Microsoft 365 data source (Graph API)</td><td>EU / US</td></tr>
          <tr><td>Resend (when email alerts are enabled)</td><td>Delivery of high-risk alert emails</td><td>EU / US</td></tr>
          <tr><td>Stripe (only if/when paid plans launch)</td><td>Payment processing</td><td>EU / US</td></tr>
        </tbody>
      </table>
      <p>During the current free launch period, no payment data is collected and Stripe is not active.</p>
      <p>
        We will notify you by email before adding or replacing a sub-processor that processes personal
        data, giving you the opportunity to object.
      </p>

      <h2>12. Data Subject Rights</h2>
      <p>
        Under the GDPR, data subjects have the following rights. As the data controller, your
        organisation facilitates these for its users; we assist on request:
      </p>
      <ul>
        <li><strong>Right of access</strong> (Art. 15) — obtain a copy of your personal data.</li>
        <li><strong>Right to rectification</strong> (Art. 16) — correct inaccurate data.</li>
        <li><strong>Right to erasure</strong> (Art. 17) — request deletion of your data.</li>
        <li><strong>Right to restriction</strong> (Art. 18) — restrict how we process your data.</li>
        <li><strong>Right to data portability</strong> (Art. 20) — receive your data in a structured,
        commonly used, machine-readable format.</li>
        <li><strong>Right to object</strong> (Art. 21) — object to processing based on legitimate
        interests. Where we process data on the basis of legitimate interests (section 5), you
        have the right to object; we will cease processing unless we demonstrate compelling
        legitimate grounds.</li>
        <li><strong>Right to lodge a complaint</strong> (Art. 77) — you may file a complaint with your
        national supervisory authority. In Italy, the competent authority is the{" "}
        <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener">
          Garante per la protezione dei dati personali
        </a>.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a>. We will respond within
        30 days.
      </p>

      <h2>13. Contact</h2>
      <p>
        <strong>Filippo Piconese — Micro SaaS</strong><br />
        Email: <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a><br />
        Website: <a href="https://www.micro-saas.it" target="_blank" rel="noopener">www.micro-saas.it</a>
      </p>

      <h2>14. Children's Privacy</h2>
      <p>ShadowGuard is a B2B security tool for organisations and is not directed at individuals under 16.</p>

      <h2>15. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by
        email at least 15 days before they take effect and revise the "Last updated" date above.
        Continued use after changes become effective constitutes acceptance.
      </p>
    </LegalLayout>
  );
}
