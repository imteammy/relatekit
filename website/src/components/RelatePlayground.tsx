import Playground from "@theme/Playground";
import ReactLiveScope from "../theme/ReactLiveScope";

const playground = `const tasks = [{ id: "t1", propertyId: "p1" }];
const properties = [{ id: "p1", name: "HQ" }];
const assignments = [{ id: "a1", taskId: "t1" }];

const result = relate(tasks, {
  property: one(properties, { on: { propertyId: "id" } }),
  assignments: many(assignments, { on: { id: "taskId" } }),
});

render(<ShowResult value={result} />);`;

export default function RelatePlayground() {
  return (
    <Playground noInline scope={ReactLiveScope}>
      {playground}
    </Playground>
  );
}
