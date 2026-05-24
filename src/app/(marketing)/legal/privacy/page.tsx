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
        <li>Personality: five trait scores only (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)—not individual test answers</li>
        <li>AI conversations and optional memory facts (Pro) to personalize ELY</li>
        <li>Billing: handled by Stripe; we do not store full card numbers</li>
      </ul>
      <h2>Psychometric data</h2>
      <p>
        Personality scores are sensitive. They are stored securely, never sold, and
        never shown to other users. You may opt out of personalization in Settings
        or export/delete your data on request.
      </p>
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
