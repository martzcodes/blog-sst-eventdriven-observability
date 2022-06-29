import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
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
  const linkColor = "source-target";
  const width = 1000;
  const nodeAlign = d3Sankey.sankeyJustify;

  // const N = d3.map(data.nodes, (d: any) => d.id);
  const LS = d3.map(data.links, (link: any) => link.source);
  const LT = d3.map(data.links, (link: any) => link.target);
  const LV = d3.map(data.links, (link: any) => link.value);

  let nodes = data.nodes;

  const N = d3.map(nodes, (d: any) => d.id);
  const G = d3.map(nodes, (d: any) => d.group);

  nodes = d3.map(nodes, (_, i) => ({ id: N[i] }));
  let links = d3.map(data.links, (_, i) => ({
    source: LS[i],
    target: LT[i],
    value: LV[i],
  }));

  
};

export const Sankey = ({ events = [] }: { events: any[] }) => {
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
      const link = `${previousState}:${
        ev.meta?.incoming?.detailType || "done"
      }$${ev.stateName}:${ev.detailType}`;
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
