export const metadata = { title: "Income Disclosure Statement" };

export default function IncomeDisclosurePage() {
  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-4 py-16 prose-headings:text-white prose-p:text-slate-400">
      <h1>Income Disclosure Statement</h1>
      <p className="text-sm text-slate-500">
        Updated quarterly · Next update scheduled per calendar quarter
      </p>
      <p>
        Most Ely affiliates earn little or no income. Success requires significant
        effort selling retail subscriptions and building an active team. Examples
        of high earners are atypical.
      </p>
      <h2>Average earnings by rank (placeholder)</h2>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th>Rank</th>
            <th>% of affiliates</th>
            <th>Avg monthly commission</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Explorer</td>
            <td>—</td>
            <td>—</td>
          </tr>
          <tr>
            <td>Builder+</td>
            <td>—</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <p>
        Actual figures will be published after sufficient operating history. See
        your dashboard for personal commission records.
      </p>
      <p className="text-sm text-amber-200/80">
        This is a template. Consult an MLM compliance attorney before public launch.
      </p>
    </article>
  );
}
