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
      lastUpdated="20 June 2026"
    >
      <h2>1. Agreement</h2>
      <p>
        These Terms of Service ("Terms") govern your access to and use of <strong>ShadowGuard</strong>{" "}
        (the "Service"), provided by <strong>Micro SaaS</strong> (Filippo Piconese, "we", "us"). By
        connecting your Google Workspace or Microsoft 365 tenant, or otherwise using the Service, you
        agree to these Terms on behalf of your organisation.
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
        <li>You must be a <strong>super administrator</strong> of the Google Workspace, or a <strong>global administrator</strong> of the Microsoft 365 tenant, that you connect — or duly authorised to act on its behalf.</li>
        <li>You are responsible for ensuring that connecting ShadowGuard complies with your organisation's policies and applicable law.</li>
      </ul>

      <h2>4. Launch Period &amp; Pricing</h2>
      <p>
        During the current launch period the Service is provided <strong>free of charge</strong> with
        full features and no payment method required. We intend to introduce paid plans in the future;
        early adopters who connect during the launch period will keep their access as described in our
        launch offer. Pricing, plans and feature allocation may change, and we will give reasonable
        notice of material changes.
      </p>

      <h2>5. Acceptable Use</h2>
      <ul>
        <li>Do not use the Service to access workspaces or tenants you are not authorised to administer.</li>
        <li>Do not attempt to disrupt, reverse engineer, or circumvent the security of the Service.</li>
        <li>Do not use the Service in violation of applicable laws or of Google's or Microsoft's terms.</li>
      </ul>

      <h2>6. Google &amp; Microsoft API Services</h2>
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

      <h2>7. Data &amp; Privacy</h2>
      <p>
        Our processing of personal data is described in the <a href="/privacy">Privacy Policy</a>, which
        forms part of these Terms. Your organisation remains the data controller for the data processed
        through the Service.
      </p>

      <h2>8. Availability &amp; Disclaimer of Warranties</h2>
      <p>
        The Service is provided "as is" and "as available", without warranties of any kind, express or
        implied. ShadowGuard is a security <em>visibility</em> tool: it assists in discovering OAuth
        risks but does not guarantee detection of every risk and is not a substitute for your own
        security program. We do not warrant that the Service will be uninterrupted or error-free,
        particularly during the launch period.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the maximum extent permitted by law, Micro SaaS shall not be liable for any indirect,
        incidental, special, consequential or punitive damages, or for any loss of data, profits or
        revenue, arising from or related to your use of the Service. Where the Service is provided free
        of charge, our aggregate liability shall not exceed EUR 100.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service and revoke its access at any time from your Google Admin console,
        or by removing the application's admin consent in Microsoft Entra ID. We may suspend or terminate
        access for breach of these Terms or to comply with law. On termination, we delete your
        organisation's data and any stored tokens or tenant identifier as described in the Privacy Policy.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of Italy, without regard to conflict-of-laws rules. Courts
        of the operator's place of business shall have jurisdiction, subject to mandatory consumer
        protections where applicable.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time; we will revise the "Last updated" date above.
        Continued use after changes become effective constitutes acceptance of the revised Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        <strong>Filippo Piconese — Micro SaaS</strong><br />
        Email: <a href="mailto:privacy@micro-saas.it">privacy@micro-saas.it</a><br />
        Website: <a href="https://www.micro-saas.it" target="_blank" rel="noopener">www.micro-saas.it</a>
      </p>
    </LegalLayout>
  );
}
