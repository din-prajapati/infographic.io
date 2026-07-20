import terms from "@/data/legal/terms.json";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PolicySections, type PolicySection } from "@/components/legal/PolicySections";

export default function TermsPage() {
  const sections = terms.sections as unknown as PolicySection[];

  return (
    <LegalLayout title={terms.title} effectiveDate={terms.effectiveDate} intro={terms.intro}>
      <PolicySections sections={sections} />
    </LegalLayout>
  );
}
