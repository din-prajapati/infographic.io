import privacy from "@/data/legal/privacy.json";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PolicySections, type PolicySection } from "@/components/legal/PolicySections";

export default function PrivacyPage() {
  const sections = privacy.sections as unknown as PolicySection[];

  return (
    <LegalLayout title={privacy.title} effectiveDate={privacy.effectiveDate} intro={privacy.intro}>
      <PolicySections sections={sections} />
    </LegalLayout>
  );
}
