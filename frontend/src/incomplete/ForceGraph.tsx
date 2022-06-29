import * as d3 from "d3";
import { color, drag } from "d3";
import { useEffect, useState } from "react";

const buildGraph = ({
  ref,
  data,
  height,
}: {
  ref: SVGSVGElement;
  data: any;
  height: number;
}) => {
  const svg = d3.select(ref);
  ref.childNodes.forEach((child) => child.remove());
  svg.selectAll("*").remove();
  const width = 1000;

  const N = d3.map(data.nodes, (d: any) => d.id);
  const LS = d3.map(data.links, (link: any) => link.source);
  const LT = d3.map(data.links, (link: any) => link.target);
  const T = d3.map(data.nodes, (d: any) => d.id);
  console.log(T);
  const G = d3.map(data.nodes, (d: any) => d.group);
  const W = d3.map(data.links, (link: any) => link.value);
  const L = d3.map(data.links, (link: any) => "#999");

  const nodes = d3.map(data.nodes, (_, i) => ({ id: N[i] }));
  const links = d3.map(data.links, (_, i) => ({
    source: LS[i],
    target: LT[i],
  }));

  const forceNode = d3.forceManyBody();
  const forceLink = d3.forceLink(links).id(({ index: i }) => N[i!]);

  svg
  .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1.5)
      .attr("stroke-linecap", "round")
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg.append("g")
      .attr("fill", "currentColor")
      .attr("stroke", "#fff")
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 10)
      // .call(drag(simulation));

  if (W) (link as any).attr("stroke-width", ((m: any) => {
    return W[m.index];
  }));
  if (L) (link as any).attr("stroke", ((m: any) => {
    return L[m.index];
  }));
  if (G) (node as any).attr("fill", ((m: any) => {
    return color(G[m.index]);
  }));
  if (T) (node as any).append("title").text(((m: any) => {
    return T[m.index];
  }));
  
  const simulation = d3.forceSimulation(nodes as any)
  .force("link", forceLink)
  .force("charge", forceNode)
  .force("center", d3.forceCenter())
  .on("tick", function() {
    console.log();
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);
  })
};

export const ForceGraph = ({ events = [] }: { events: any[] }) => {
  const [svgHeight, setSvgHeight] = useState(100);
  const [svgRef, setSvgRef] = useState<SVGSVGElement>();
  const [taskTokens, setTaskTokens] = useState<Record<string, string>>({});

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
    const stateNames = [...stateNameSet];
    const linkMap: any = {};
    const ids = sortedEvents.map((ev) => {
      const prevStateInd = stateNames.findIndex(
        (state) => state === ev.stateName
      );
      let prevState = "start";
      if (prevStateInd - 1 >= 0) {
        prevState = stateNames[prevStateInd - 1];
      }
      const previousState = ev.meta?.incoming?.detailType
        ? ev.stateName
        : prevState;
      const link = `${previousState}:${ev.meta?.incoming?.detailType || "done"}$${ev.stateName}:${ev.detailType}`;
      if (Object.keys(linkMap).includes(link)) {
        linkMap[link] += 1;
      } else {
        linkMap[link] = 1;
      }

      return `${ev.stateName}$${ev.detailType}$${
        stateTaskTokens[ev.TaskToken]
      }`;
    });

    console.log(linkMap);
    const graphObj = Object.keys(linkMap).reduce(
      (p: any, c: any) => {
        const splitLink = c.split("$");

        console.log(splitLink);
        const updatedNodes = [...p.nodes];
        const firstInd = updatedNodes.findIndex(
          (n: any) => n.id === splitLink[0]
        );
        if (firstInd === -1) {
          updatedNodes.push({
            id: splitLink[0],
            group: splitLink[0].split(":")[0],
          });
        }
        const secondInd = updatedNodes.findIndex(
          (n: any) => n.id === splitLink[1]
        );
        if (secondInd === -1) {
          updatedNodes.push({
            id: splitLink[1],
            group: splitLink[1].split(":")[0],
          });
        }
        return {
          nodes: updatedNodes,
          links: [
            ...p.links,
            { source: splitLink[0], target: splitLink[1], value: linkMap[c] },
          ],
        };
      },
      {
        nodes: [],
        links: [],
      } as any
    );
    console.log(graphObj);

    buildGraph({ ref: svgRef!, data: graphObj, height: 500 });
  };

  useEffect(() => {
    if (events.length) {
      processEvents();
    }
  }, [events]);
  return (
    <div>
      <svg
        className="container"
        height={svgHeight}
        width={1000}
        ref={(ref: SVGSVGElement) => setSvgRef(ref)}
      ></svg>
    </div>
  );
};
