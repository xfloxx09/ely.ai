export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-16 prose-headings:text-white prose-p:text-slate-400">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        Ely (ely.ai) respects your privacy. We collect account information,
        usage data, and payment details processed by Stripe.
      </p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account: name, email, password (hashed)</li>
        <li>AI conversations stored to improve your experience</li>
        <li>Billing: handled by Stripe; we do not store full card numbers</li>
      </ul>
      <h2>How we use data</h2>
      <p>
        To provide the service, process subscriptions, calculate affiliate
        commissions, and improve Ely. We do not sell personal data.
      </p>
      <p className="text-sm text-amber-200/80">
        This is a template. Consult qualified legal counsel before public launch.
      </p>
    </article>
  );
}
