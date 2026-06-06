import { LegalLayout } from "@/components/legal-layout";

export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="ShadowGuard — Shadow IT Detector for Google Workspace"
      lastUpdated="6 June 2026"
    >
      <h2>1. Introduction</h2>
      <p>
        This Privacy Policy describes how <strong>Micro SaaS</strong> (operated by Filippo Piconese,
        "we", "us") processes personal data when your organisation connects and uses{" "}
        <strong>ShadowGuard</strong> (the "Service") at <strong>shadowit.micro-saas.it</strong> with
        your Google Workspace.
      </p>
      <p>
        ShadowGuard is a web application that connects to your Google Workspace via Google's OAuth and
        Admin SDK APIs to discover the third-party OAuth applications your users have authorised, and
        to score them by risk. The Service runs on our own cloud infrastructure and database.
      </p>
      <div className="sg-callout">
        <strong>Key takeaway:</strong> ShadowGuard reads the <em>authorisation grants</em> in your
        Workspace (which apps users connected, and the scopes granted). It <strong>never reads the
        content</strong> of your emails, files, calendars or documents.
      </div>

      <h2>2. Data Controller and Data Processor</h2>
      <p>Under the GDPR and applicable data protection laws:</p>
      <ul>
        <li><strong>Data Controller:</strong> the organisation that owns the Google Workspace where ShadowGuard is connected (your company). You determine the purposes and means of processing.</li>
        <li><strong>Data Processor:</strong> Micro SaaS (Filippo Piconese) processes data on your behalf, solely to provide the Service.</li>
        <li><strong>Sub-processors:</strong> the infrastructure and service providers listed in section 9.</li>
      </ul>

      <h2>3. What Data We Process</h2>
      <h3>3.1 Account &amp; identity (the connecting admin)</h3>
      <ul>
        <li>Google account identifier, email address, display name and profile picture</li>
        <li>Your Workspace domain (e.g. <em>company.com</em>)</li>
      </ul>
      <h3>3.2 Workspace OAuth grants (the data we analyse)</h3>
      <ul>
        <li>Third-party application name and OAuth client ID</li>
        <li>The OAuth scopes each application was granted</li>
        <li>The email addresses of users who authorised each application</li>
        <li>Derived metadata: category, risk score, first/last seen timestamps, scan history</li>
      </ul>
      <h3>3.3 Google OAuth tokens</h3>
      <p>
        To run scans on your behalf, we store the OAuth access and refresh tokens issued by Google for
        the connected Workspace. They are used solely to call the Google Admin SDK to perform scans and
        are never shared. You can revoke them at any time from your Google Admin console, which
        immediately stops all access.
      </p>
      <h3>3.4 Data we do NOT process</h3>
      <ul>
        <li>The content of emails, Drive files, documents, calendars or chats</li>
        <li>Passwords or credentials of your users</li>
        <li>Any data beyond the read-only directory and token-listing scopes you approve</li>
      </ul>

      <h2>4. Google API Services — Limited Use</h2>
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

      <h2>5. Lawful Basis for Processing</h2>
      <ul>
        <li><strong>Contract performance (Art. 6(1)(b)):</strong> processing is necessary to provide the Service you connected your Workspace for.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> monitoring third-party access to a Workspace to prevent data exposure is a legitimate security interest of the controller.</li>
      </ul>

      <h2>6. Data Retention</h2>
      <ul>
        <li>Discovered apps, scan history and identity data are retained while your Workspace remains connected.</li>
        <li>When you disconnect (revoke access in Google Admin) or request deletion, we delete your organisation's data and stored tokens.</li>
        <li>You can request erasure at any time by contacting us (section 10).</li>
      </ul>

      <h2>7. Security Measures</h2>
      <ul>
        <li>All traffic is served over HTTPS/TLS.</li>
        <li>ShadowGuard requests only <strong>read-only</strong> Google scopes; it can never modify your Workspace.</li>
        <li>Each customer's data is isolated per organisation; access is gated by an authenticated session and Workspace super-admin verification.</li>
        <li>OAuth tokens are stored in our database and used solely to perform scans; access is restricted.</li>
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
          <tr><td>Google LLC</td><td>Identity (OAuth) &amp; Workspace data source (Admin SDK)</td><td>EU / US</td></tr>
          <tr><td>Email provider (when configured)</td><td>Delivery of high-risk alert emails</td><td>EU / US</td></tr>
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
