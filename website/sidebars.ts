import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    "overview",
    "getting-started",
    {
      type: "category",
      label: "Guides",
      items: ["guides/relations", "guides/predefined-relate", "guides/typescript", "guides/modes-and-errors"],
    },
    "api",
  ],
};

export default sidebars;
