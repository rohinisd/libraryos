import { redirect } from "next/navigation";

// proxy.ts already sends unauthenticated visitors to /login; anyone who
// reaches this route is signed in, so just land them on the dashboard.
export default function RootPage() {
  redirect("/dashboard");
}
