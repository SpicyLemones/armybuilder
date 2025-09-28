export function About() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-3xl font-display font-bold">About</h1>
      <p className="text-slate-700 dark:text-slate-300">
        PriceHammer helps you look up Games Workshop products and compare prices across retailers.
        Data is curated and updated periodically.
      </p>
      <p>
        Currently data only covers the OCE region, with a few select LGS'.
      </p>
      <p className="text-slate-700 dark:text-slate-300">
        This is a hobby project; not affiliated with Games Workshop. If you find bugs or have suggestions,
        please reach out via email below.
      </p>
    </div>
  );
}
