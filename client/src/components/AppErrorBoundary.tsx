import { Component, ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: Error };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // You could log to console or send to your own endpoint here
    console.error("AppErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto text-center space-y-4 py-16">
          <h1 className="text-4xl font-display font-bold">Something went wrong</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Please try again or return to the homepage.
          </p>
          <div className="space-x-3">
            <button
              className="rounded-md bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
              onClick={() => location.reload()}
            >
              Reload
            </button>
            <Link
              to="/"
              className="inline-block rounded-md border border-slate-300 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
