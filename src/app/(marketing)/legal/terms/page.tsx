export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-16 prose-headings:text-white prose-p:text-slate-400">
      <h1>Terms of Service</h1>
      <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        These Terms govern your use of Ely (ely.ai), operated as a subscription
        software service. By using Ely, you agree to these Terms.
      </p>
      <h2>Subscriptions</h2>
      <p>
        Paid plans renew automatically until canceled via your account billing
        portal. First-time subscribers may request a refund within 30 days of
        their initial purchase.
      </p>
      <h2>Affiliate program</h2>
      <p>
        Ely Pro includes eligibility to participate in our affiliate compensation
        plan. Commissions are paid only on verified subscription revenue from
        active customers. Affiliates must not make income claims or engage in
        spam or deceptive marketing.
      </p>
      <h2>Acceptable use</h2>
      <p>
        You may not misuse Ely, attempt to circumvent usage limits, or use the
        service for unlawful purposes.
      </p>
      <p className="text-sm text-amber-200/80">
        This is a template. Consult qualified legal counsel before public launch.
      </p>
    </article>
  );
}
