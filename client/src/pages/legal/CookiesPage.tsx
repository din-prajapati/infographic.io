import cookies from "@/data/legal/cookies.json";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PolicySections, type PolicySection } from "@/components/legal/PolicySections";

export default function CookiesPage() {
  const sections = cookies.sections as unknown as PolicySection[];

  return (
    <LegalLayout title={cookies.title} effectiveDate={cookies.effectiveDate} intro={cookies.intro}>
      <PolicySections sections={sections} />
    </LegalLayout>
  );
}
