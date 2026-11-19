import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

const config: Config = {
  title: "RelateKit",
  tagline: "Build typed nested objects from related data sets",
  favicon: "img/relatekit-icon.png",
  url: process.env.DOCUSAURUS_URL ?? "https://relatekit.dev",
  baseUrl: process.env.DOCUSAURUS_BASE_URL ?? "/",
  organizationName: "imteammy",
  projectName: "relatekit",
  onBrokenLinks: "throw",
  markdown: {
    hooks: { onBrokenMarkdownLinks: "throw" },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          routeBasePath: "docs",
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      },
    ],
  ],
  themes: [
    "@docusaurus/theme-live-codeblock",
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        docsRouteBasePath: "docs",
        docsDir: "docs",
        indexBlog: false,
        indexPages: false,
        language: "en",
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "RelateKit",
      logo: {
        alt: "RelateKit logo",
        src: "img/relatekit-icon.png",
      },
      hideOnScroll: false,
      items: [
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        { to: "/playground", label: "Playground", position: "left" },
        { href: "https://www.npmjs.com/package/relatekit", label: "npm", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Documentation",
          items: [{ label: "Getting started", to: "/docs/getting-started" }],
        },
        {
          title: "Package",
          items: [{ label: "npm", href: "https://www.npmjs.com/package/relatekit" }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} RelateKit.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
    },
    liveCodeBlock: {
      playgroundPosition: "bottom",
    },
  } satisfies Config["themeConfig"],
};

export default config;
