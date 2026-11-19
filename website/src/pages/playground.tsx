import Heading from "@theme/Heading";
import Layout from "@theme/Layout";
import type { ReactElement } from "react";
import RelatePlayground from "../components/RelatePlayground";
import styles from "./playground.module.css";

export default function PlaygroundPage(): ReactElement {
  return (
    <Layout title="Playground" description="Edit a RelateKit example and see the result.">
      <main className={styles.main}>
        <p className={styles.eyebrow}>Interactive example</p>
        <Heading as="h1">Playground</Heading>
        <p className={styles.intro}>
          Change the sample rows or key mapping. The result runs with the RelateKit package in your browser.
        </p>
        <RelatePlayground />
      </main>
    </Layout>
  );
}
