import type { ReactNode } from "react";

export type PolicyParagraphBlock = {
  type: "paragraph";
  text: string;
};

export type PolicyListItem =
  | string
  | {
      text: string;
      children?: string[];
    };

export type PolicyListBlock = {
  type: "list";
  style?: "bullet" | "numbered";
  title?: string;
  items: PolicyListItem[];
};

export type PolicySubheadingBlock = {
  type: "subheading";
  text: string;
};

export type PolicyDefinitionListBlock = {
  type: "definition_list";
  items: Array<{ term: string; description: string }>;
};

export type PolicyBlock =
  | PolicyParagraphBlock
  | PolicyListBlock
  | PolicySubheadingBlock
  | PolicyDefinitionListBlock;

export type PolicySection = {
  key: string;
  title: string;
  blocks: PolicyBlock[];
};

const paragraphClass = "text-gray-700 leading-relaxed mb-4";
const listClass = "pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed";

function renderBlock(block: PolicyBlock, key: string): ReactNode | null {
  if (block.type === "paragraph") {
    if (!block.text) return null;
    return (
      <p key={key} className={paragraphClass}>
        {block.text}
      </p>
    );
  }

  if (block.type === "subheading") {
    if (!block.text) return null;
    return (
      <h3 key={key} className="text-lg font-semibold text-gray-900 mt-6 mb-2">
        {block.text}
      </h3>
    );
  }

  if (block.type === "list") {
    if (!block.items?.length) return null;
    const ListTag = block.style === "numbered" ? "ol" : "ul";
    return (
      <ListTag
        key={key}
        className={`${listClass} ${block.style === "numbered" ? "list-decimal" : "list-disc"}`}
      >
        {block.items.map((item, i) => {
          if (typeof item === "string") {
            return <li key={`${key}-${i}`}>{item}</li>;
          }
          return (
            <li key={`${key}-${i}`}>
              {item.text}
              {item.children?.length ? (
                <ul className="list-disc pl-6 space-y-1 mt-2">
                  {item.children.map((child, ci) => (
                    <li key={`${key}-${i}-${ci}`}>{child}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ListTag>
    );
  }

  if (block.type === "definition_list") {
    if (!block.items?.length) return null;
    return (
      <dl key={key} className="space-y-3 mb-4">
        {block.items.map((item, i) => (
          <div key={`${key}-${i}`}>
            <dt className="font-medium text-gray-900">{item.term}</dt>
            <dd className="text-gray-700 leading-relaxed">{item.description}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return null;
}

export function PolicySections({ sections }: { sections: PolicySection[] }) {
  return (
    <>
      {sections.map((section, sectionIndex) => (
        <section key={section.key}>
          <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-3">
            {sectionIndex + 1}. {section.title}
          </h2>
          {section.blocks.map((block, blockIndex) =>
            renderBlock(block, `${section.key}-${blockIndex}`),
          )}
        </section>
      ))}
    </>
  );
}
