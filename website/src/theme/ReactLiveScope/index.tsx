import * as React from "react";
import { many, one, relate } from "../../../../dist/index.js";

function ShowResult({ value }: { value: unknown }): React.JSX.Element {
  return (
    <pre className="relatekit-live-result">
      <code>{JSON.stringify(value, null, 2) ?? "undefined"}</code>
    </pre>
  );
}

const ReactLiveScope = {
  React,
  ...React,
  relate,
  one,
  many,
  ShowResult,
};

export default ReactLiveScope;
