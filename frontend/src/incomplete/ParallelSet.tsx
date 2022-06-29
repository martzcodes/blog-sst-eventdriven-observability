import * as d3 from "d3";
import { useEffect, useState } from "react";

export const ParallelSet = ({ events = [] }: { events: any[] }) => {
  const [taskTokens, setTaskTokens] = useState<Record<string, string>>({});
  const [renderableData, setRenderableData] = useState([]);

  const processEvents = async () => {
    const sortedEvents = events.sort((a, b) => Number(a.sk) - Number(b.sk));
    const taskTokenSet = new Set<string>([]);
    sortedEvents.forEach((ev) => taskTokenSet.add(ev.TaskToken));
    const states = sortedEvents.filter((ev: any) => !ev.meta);
    const stateNameSet = new Set<string>([]);
    states.forEach((state) => stateNameSet.add(state.stateName));
    const stateTaskTokens = [...taskTokenSet].reduce(
      (p: any, c: any, ind: number) => {
        return { ...p, [c]: ind + 1 };
      },
      {} as any
    );
    setTaskTokens(stateTaskTokens);
    const stateSteps = new Set<string>([]);
    const stateMap: any = {};
    const stateNames = [...stateNameSet];
    const previousStateSet = new Set<string>([]);
    const ids = sortedEvents.map((ev) => {
      const prevStateInd = stateNames.findIndex(
        (state) => state === ev.stateName
      );
      let prevState = "";
      if (prevStateInd - 1 >= 0) {
        prevState = stateNames[prevStateInd - 1];
      }
      const previousDetailType =
        ev.meta?.incoming?.detailType || "done";
      const previousState = ev.meta?.incoming?.detailType
        ? ev.stateName
        : prevState;
      if (prevState) {
        previousStateSet.add(`${previousState}$${previousDetailType}`);
      }
      if (Object.keys(stateMap).includes(ev.stateName)) {
        if (Object.keys(stateMap[ev.stateName]).includes(ev.detailType)) {
          stateMap[ev.stateName][ev.detailType].push({
            taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
            previousDetailType,
            previousState,
          });
        } else {
          stateMap[ev.stateName][ev.detailType] = [
            {
              taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
              previousDetailType,
              previousState,
            },
          ];
        }
      } else {
        stateMap[ev.stateName] = {
          [ev.detailType]: [
            {
              taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
              previousDetailType,
              previousState,
            },
          ],
        };
      }
      stateSteps.add(`${ev.stateName}$${ev.detailType}`);
      return `${ev.stateName}$${ev.detailType}$${
        stateTaskTokens[ev.TaskToken]
      }`;
    });

    const startStates = states.map(
      (ev) =>
        `${ev.stateName}$${ev.detailType}$${stateTaskTokens[ev.TaskToken]}`
    );

    const statesToReduce = [...stateSteps];
    const flattened: any[] = [];
    const data = statesToReduce.reduce((p: any, c: any, ind: number) => {
      const stepList = ids
        .filter((id) => id.startsWith(`${c}$`))
        .map((id) => {
          if (ind !== 0) {
            // first of the state steps ends up all the previous states done
            // otherwise it's 1-1 with task token for the previous
            const splitId = id.split("$");
            const [state, step, token] = splitId;
            const mappedStep = stateMap[state][step];
            const mapped = mappedStep.find((mappedToken: any) => {
              return `${mappedToken.taskToken}` === `${token}`;
            });
            let parents = [
              `${mapped.previousState}$${mapped.previousDetailType}$${mapped.taskToken}`,
            ];
            if (mapped.previousDetailType === "done") {
              const prevInd = p.findIndex(
                (prevRow: any) =>
                  prevRow.filter((prev: any) =>
                    prev.id.startsWith(
                      `${mapped.previousState}$${mapped.previousDetailType}$`
                    )
                  ).length
              );
              parents = [p[prevInd].map((prev: any) => prev.id)];
            }
            return {
              id,
              parents,
            };
          }
          return { id };
        });
      flattened.push(...stepList);
      return [...p, stepList];
    }, [] as any);
    console.log(data);
    console.log(flattened);
    console.log(stateMap);
    console.log([...previousStateSet]);

    const parallelMap = [...stateNameSet].reduce((p: any, c: any) => {
      console.log(c);
      const stateMapped = stateMap[c];
      const keys = Object.keys(stateMapped).filter(
        (key: any) => key !== "done"
      );
      return [
        ...p,
        ...keys.map((key) => ({
          step: key,
          state: c,
          value: stateMapped[key].length,
        })),
      ];
    }, [] as any);

    console.log(parallelMap);
    setRenderableData(data);
  };

  useEffect(() => {
    if (events.length) {
      processEvents();
    }
  }, [events]);
  return <div></div>;
};
