import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import type { ReactElement } from "react";
import RelatePlayground from "../components/RelatePlayground";
import styles from "./index.module.css";

export default function Home(): ReactElement {
  return (
    <Layout
      title="Typed relations for TypeScript"
      description="Turn separate arrays into typed nested objects."
    >
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>RelateKit 0.1</p>
          <Heading as="h1">Connect your data with types intact.</Heading>
          <p className={styles.lead}>
            Build nested objects from separate arrays with inferred keys, checked relations, and no input mutation.
          </p>
          <div className={styles.actions}>
            <Link className="button button--primary button--lg" to="/docs/getting-started">
              Get started
            </Link>
            <Link className="button button--secondary button--lg" to="/docs/api">
              API reference
            </Link>
          <Link className="button button--secondary button--lg" to="/playground">
            Playground
          </Link>
          </div>
        </section>
        <section className={styles.codeSection}>
          <p className={styles.codeCaption}>Change the mapping or the sample rows. The result updates as you type.</p>
          <RelatePlayground />
        </section>
        <section className={styles.cards}>
          <article>
            <span className={styles.cardNumber}>01</span>
            <Heading as="h2">Typed as you write</Heading>
            <p>Infer parent and child keys. TypeScript checks the mapping and the final nested result.</p>
          </article>
          <article>
            <span className={styles.cardNumber}>02</span>
            <Heading as="h2">Strict by default</Heading>
            <p>Catch duplicate matches for one relations. Choose loose mode when first-match behavior fits.</p>
          </article>
          <article>
            <span className={styles.cardNumber}>03</span>
            <Heading as="h2">Small runtime</Heading>
            <p>Relate in-memory data synchronously without mutating input rows or adding runtime dependencies.</p>
          </article>
        </section>
      </main>
    </Layout>
  );
}
