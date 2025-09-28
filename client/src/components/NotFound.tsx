import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="max-w-xl mx-auto text-center space-y-4 py-16">
      <h1 className="text-5xl font-display font-bold">404</h1>
      <p className="text-slate-600 dark:text-slate-300">
        We couldn’t find that page.
      </p>
      <Link
        to="/"
        className="inline-block rounded-md bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
      >
        Back to Product Lookup
      </Link>
    </div>
  );
}
