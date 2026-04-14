import { redirect } from "next/navigation";

export default function RootPage() {
  // TODO: check if user has completed onboarding (via cookie/session)
  redirect("/onboarding");
}
