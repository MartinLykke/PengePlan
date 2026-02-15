"use client";

import { useState } from "react";
import { SiteMascot } from "./components/site-mascot";
import { SavingsProjection } from "./components/savings-projection";

export default function Home() {
  const [reportName, setReportName] = useState("");
  const mascotSteps = [
    {
      targetId: "tour-report-name",
      title: "Rapportnavn",
      text: "Her giver du budgettet et navn.",
    },
    {
      targetId: "tour-card-income",
      title: "Indtaegter",
      text: "Her indtaster du dine indtaegter.",
    },
    {
      targetId: "tour-card-housing",
      title: "Bolig",
      text: "Her indtaster du dine boligudgifter.",
    },
    {
      targetId: "tour-card-transport",
      title: "Transport",
      text: "Her indtaster du udgifter til transport.",
    },
    {
      targetId: "tour-card-fixed",
      title: "Oevrige faste",
      text: "Her indtaster du dine oevrige faste udgifter.",
    },
    {
      targetId: "tour-wealth-assumptions",
      title: "Formueforudsaetninger",
      text: "Her indstiller du opsparing, bolig, gaeld og renter.",
    },
    {
      targetId: "tour-pension",
      title: "Pension",
      text: "Her kan du se din forventede pensionsudvikling.",
    },
    {
      targetId: "tour-sidebar",
      title: "Overblik",
      text: "Her kan du se noegletal, score og indsigt samlet.",
    },
  ] as const;

  return (
    <main className="app-shell min-h-screen px-1 py-4 md:px-2 md:py-5">
      <SiteMascot steps={[...mascotSteps]} />
      <SavingsProjection reportName={reportName} onReportNameChange={setReportName} />
    </main>
  );
}
