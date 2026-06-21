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
      lastUpdated="20 June 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy describes how <strong>Micro SaaS</strong> (operated by Filippo Piconese,
        "we", "us") processes personal data when your organisation connects and uses{" "}
        <strong>ShadowGuard</strong> (the "Service") at <strong>shadowit.micro-saas.it</strong> with
        your <strong>Google Workspace</strong> or <strong>Microsoft 365</strong>.
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
        <li><strong>Data Controller:</strong> the organisation that owns the Google Workspace or Microsoft 365 tenant where ShadowGuard is connected (your company). You determine the purposes and means of processing.</li>
        <li><strong>Data Processor:</strong> Micro SaaS (Filippo Piconese) processes data on your behalf, solely to provide the Service.</li>
        <li><strong>Sub-processors:</strong> the infrastructure and service providers listed in section 9.</li>
      </ul>

      <h2>3. What Data We Process</h2>
      <h3>3.1 Account &amp; identity (the connecting admin)</h3>
      <ul>
        <li>Provider account identifier (Google user ID or Microsoft object ID), email address, display name and (where provided) profile picture</li>
        <li>Your workspace or tenant domain (e.g. <em>company.com</em>)</li>
      </ul>
      <h3>3.2 OAuth grants (the data we analyse)</h3>
      <ul>
        <li>Third-party application name and OAuth client/application ID</li>
        <li>The OAuth scopes/permissions each application was granted</li>
        <li>The email addresses of users who authorised each application, and the directory user roster captured at scan time</li>
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
        <li><strong>Contract performance (Art. 6(1)(b)):</strong> processing is necessary to provide the Service you connected your Workspace for.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> monitoring third-party access to a Workspace to prevent data exposure is a legitimate security interest of the controller.</li>
      </ul>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Discovered apps, scan history and identity data are retained while your workspace or tenant remains connected.</li>
        <li>When you disconnect (revoke access in the Google Admin console, or remove admin consent in Microsoft Entra ID) or request deletion, we delete your organisation's data and any stored tokens or tenant identifier.</li>
        <li>You can request erasure at any time by contacting us (section 10).</li>
      </ul>

      <h2>7. Security Measures</h2>
      <ul>
        <li>All traffic is served over HTTPS/TLS.</li>
        <li>ShadowGuard requests only <strong>read-only</strong> permissions (Google directory scopes; Microsoft Graph read-only application permissions); it can never modify your workspace or tenant.</li>
        <li>Each customer's data is isolated per organisation; access is gated by an authenticated session and administrator verification.</li>
        <li>Google OAuth tokens are encrypted at rest and used solely to perform scans; for Microsoft we store only the tenant identifier. Access is restricted.</li>
      </ul>

      <h2>8. Cookies and Tracking</h2>
      <p>
        ShadowGuard uses a single essential session cookie to keep you signed in. We do not use
        advertising or third-party analytics trackers.
      </p>

      <h2>9. Sub-Processors</h2>
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

      <h2>10. Data Subject Rights &amp; Contact</h2>
      <p>
        You may exercise your rights of access, rectification, erasure and restriction under the GDPR.
        As the data controller, your organisation facilitates these for its users; we assist on request.
      </p>
      <p>
        <strong>Filippo Piconese — Micro SaaS</strong><br />
        Email: <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a><br />
        Website: <a href="https://www.micro-saas.it" target="_blank" rel="noopener">www.micro-saas.it</a>
      </p>

      <h2>11. Children's Privacy</h2>
      <p>ShadowGuard is a B2B security tool for organisations and is not directed at individuals under 16.</p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time; we will revise the "Last updated" date
        above. Continued use after changes become effective constitutes acceptance.
      </p>
    </LegalLayout>
  );
}
