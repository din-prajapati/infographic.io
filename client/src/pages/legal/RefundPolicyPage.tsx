import refund from "@/data/legal/refund.json";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PolicySections, type PolicySection } from "@/components/legal/PolicySections";

export default function RefundPolicyPage() {
  const sections = refund.sections as unknown as PolicySection[];

  return (
    <LegalLayout title={refund.title} effectiveDate={refund.effectiveDate} intro={refund.intro}>
      <PolicySections sections={sections} />
    </LegalLayout>
  );
}
