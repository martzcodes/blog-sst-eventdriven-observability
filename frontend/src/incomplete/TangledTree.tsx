import * as d3 from "d3";
import { useEffect, useState } from "react";

const renderChart = (data: any, options: any={}) => {
  options.color ||= (d: any, i: any) => color(i)
  
  const tangleLayout = constructTangleLayout([...data], options);

  return (<svg width={tangleLayout.layout.width} height={tangleLayout.layout.height} style={{backgroundColor: "white"}}>
  ${tangleLayout.bundles.map((b: any, i: any) => {
    let d = b.links
      .map(
        (l: any) => `
      M${l.xt} ${l.yt}
      L${l.xb - l.c1} ${l.yt}
      A${l.c1} ${l.c1} 90 0 1 ${l.xb} ${l.yt + l.c1}
      L${l.xb} ${l.ys - l.c2}
      A${l.c2} ${l.c2} 90 0 0 ${l.xb + l.c2} ${l.ys}
      L${l.xs} ${l.ys}`
      )
      .join("");
    return <>
      <path className="link" d={d} stroke="white" stroke-width="5"/>
      <path className="link" d={d} stroke={`${options.color(b, i)}`} stroke-width="2"/>
      </>;
  })}

  ${tangleLayout.nodes.map(
    (n: any) => <>
    <path className="selectable node" data-id={
      n.id
    } stroke="black" stroke-width="8" d={`M${n.x} ${n.y - n.height / 2} L${
      n.x
    } ${n.y + n.height / 2}`}/>
    <path className="node" stroke="white" stroke-width="4" d={`M${n.x} ${n.y -
      n.height / 2} L${n.x} ${n.y + n.height / 2}`}/>

    <text className="selectable" data-id={`${n.id}`} x={`${n.x + 4}`} y={`${n.y -
      n.height / 2 -
      4}`} stroke="white" stroke-width="2">${n.id}</text>
    <text x={`${n.x + 4}`} y={`${n.y -
      n.height / 2 -
      4}`} style={{pointerEvents: "none"}}>${n.id}</text>
  </>
  )}

  </svg>);
}

const color = d3.scaleOrdinal(d3.schemeDark2);

const constructTangleLayout = (levels: any, options: any = {}) => {
  console.log(levels);
  // precompute level depth
  levels.forEach((l: any, i: any) => l.forEach((n: any) => (n.level = i)));

  var nodes = levels.reduce((a: any, x: any) => a.concat(x), []);
  var nodes_index: any = {};
  nodes.forEach((d: any) => (nodes_index[d.id] = d));

  // objectification
  nodes.forEach((d: any) => {
    d.parents = (d.parents === undefined ? [] : d.parents).map(
      (p: any) => nodes_index[p]
    ).filter((p: any) => !!p);
  });

  // precompute bundles
  levels.forEach((l: any, i: any) => {
    var index: any = {};
    l.forEach((n: any) => {
      if (n.parents.length == 0) {
        return;
      }

      var id: any = n.parents
        .map((d: any) => d.id)
        .sort()
        .join("-X-");
      if (id in index) {
        index[id].parents = index[id].parents.concat(n.parents);
      } else {
        index[id] = {
          id: id,
          parents: n.parents.slice(),
          level: i,
          span: i - d3.min([...n.parents], (p: any) => p.level),
        };
      }
      n.bundle = index[id];
    });
    l.bundles = Object.keys(index).map((k) => index[k]);
    l.bundles.forEach((b: any, i: any) => (b.i = i));
  });

  var links: any = [];
  nodes.forEach((d: any) => {
    d.parents.forEach((p: any) =>
      links.push({ source: d, bundle: d.bundle, target: p })
    );
  });

  var bundles = levels.reduce((a: any, x: any) => a.concat(x.bundles), []);

  // reverse pointer from parent to bundles
  bundles.forEach((b: any) =>
    b.parents.forEach((p: any) => {
      if (p.bundles_index === undefined) {
        p.bundles_index = {};
      }
      if (!(b.id in p.bundles_index)) {
        p.bundles_index[b.id] = [];
      }
      p.bundles_index[b.id].push(b);
    })
  );

  nodes.forEach((n: any) => {
    if (n.bundles_index !== undefined) {
      n.bundles = Object.keys(n.bundles_index).map((k) => n.bundles_index[k]);
    } else {
      n.bundles_index = {};
      n.bundles = [];
    }
    n.bundles.sort((a: any, b: any) =>
      d3.descending(
        d3.max(a, (d: any) => d.span),
        d3.max(b, (d: any) => d.span)
      )
    );
    n.bundles.forEach((b: any, i: any) => (b.i = i));
  });

  links.forEach((l: any) => {
    if (l.bundle.links === undefined) {
      l.bundle.links = [];
    }
    l.bundle.links.push(l);
  });

  // layout
  const padding = 8;
  const node_height = 22;
  const node_width = 70;
  const bundle_width = 14;
  const level_y_padding = 16;
  const metro_d = 4;
  const min_family_height = 22;

  options.c ||= 16;
  const c = options.c;
  options.bigc ||= node_width + c;

  nodes.forEach(
    (n: any) => (n.height = (Math.max(1, n.bundles.length) - 1) * metro_d)
  );

  var x_offset = padding;
  var y_offset = padding;
  levels.forEach((l: any) => {
    x_offset += l.bundles.length * bundle_width;
    y_offset += level_y_padding;
    l.forEach((n: any, i: any) => {
      n.x = n.level * node_width + x_offset;
      n.y = node_height + y_offset + n.height / 2;

      y_offset += node_height + n.height;
    });
  });

  var i = 0;
  levels.forEach((l: any) => {
    l.bundles.forEach((b: any) => {
      b.x =
        d3.max([...b.parents], (d: any) => d.x) +
        node_width +
        (l.bundles.length - 1 - b.i) * bundle_width;
      b.y = i * node_height;
    });
    i += l.length;
  });

  links.forEach((l: any) => {
    l.xt = l.target.x;
    l.yt =
      l.target.y +
      l.target.bundles_index[l.bundle.id].i * metro_d -
      (l.target.bundles.length * metro_d) / 2 +
      metro_d / 2;
    l.xb = l.bundle.x;
    l.yb = l.bundle.y;
    l.xs = l.source.x;
    l.ys = l.source.y;
  });

  // compress vertical space
  var y_negative_offset = 0;
  levels.forEach((l: any) => {
    y_negative_offset +=
      -min_family_height +
        (d3.min([...l.bundles], (b: any) =>
          d3.min([...b.links], (link: any) => link.ys - 2 * c - (link.yt + c))
        ) || 0);
    l.forEach((n: any) => (n.y -= y_negative_offset));
  });

  // very ugly, I know
  links.forEach((l: any) => {
    l.yt =
      l.target.y +
      l.target.bundles_index[l.bundle.id].i * metro_d -
      (l.target.bundles.length * metro_d) / 2 +
      metro_d / 2;
    l.ys = l.source.y;
    l.c1 =
      l.source.level - l.target.level > 1
        ? Math.min(options.bigc, l.xb - l.xt, l.yb - l.yt) - c
        : c;
    l.c2 = c;
  });

  var layout = {
    width: d3.max([...nodes], (n: any) => n.x) + node_width + 2 * padding,
    height: d3.max([...nodes], (n: any) => n.y) + node_height / 2 + 2 * padding,
    node_height,
    node_width,
    bundle_width,
    level_y_padding,
    metro_d,
  };

  return { levels, nodes, nodes_index, links, bundles, layout };
};

export const TangledTree = ({ events = [] }: { events: any[] }) => {
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
    const ids = sortedEvents.map((ev) => {
      const prevStateInd = stateNames.findIndex(
        (state) => state === ev.stateName
      );
      let prevState = ev.stateName;
      if (prevStateInd - 1 >= 0) {
        prevState = stateNames[prevStateInd - 1];
      }
      if (Object.keys(stateMap).includes(ev.stateName)) {
        if (Object.keys(stateMap[ev.stateName]).includes(ev.detailType)) {
          stateMap[ev.stateName][ev.detailType].push({
            taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
            previousDetailType:
              ev.meta?.incoming?.detailType || "task.finished",
            previousState: ev.meta?.incoming?.detailType
              ? ev.stateName
              : prevState,
          });
        } else {
          stateMap[ev.stateName][ev.detailType] = [
            {
              taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
              previousDetailType:
                ev.meta?.incoming?.detailType || "task.finished",
              previousState: ev.meta?.incoming?.detailType
                ? ev.stateName
                : prevState,
            },
          ];
        }
      } else {
        stateMap[ev.stateName] = {
          [ev.detailType]: [
            {
              taskToken: stateTaskTokens[ev.TaskToken] || ev.TaskToken,
              previousDetailType:
                ev.meta?.incoming?.detailType || "task.finished",
              previousState: ev.meta?.incoming?.detailType
                ? ev.stateName
                : prevState,
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
    const data = statesToReduce.reduce((p: any, c: any, ind: number) => {
      const stepList = ids
        .filter((id) => id.startsWith(`${c}$`))
        .map((id) => {
          if (ind !== 0) {
            // first of the state steps ends up all the previous states task.finished
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
            if (mapped.previousDetailType === "task.finished") {
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
      return [...p, stepList];
    }, [] as any);
    console.log(data);
    setRenderableData(data);
  };

  useEffect(() => {
    if (events.length) {
      processEvents();
    }
  }, [events]);
  return (
    <div>
      {renderableData.length ? renderChart(renderableData) : <></>}
    </div>
  );
};
