import * as d3 from "d3";
import { useEffect, useState } from "react";

const buildGraph = ({ ref, data }: { ref: HTMLDivElement; data: any }) => {
  const height = 600;
  const width = 1000;
  const svg = d3.create("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("font", "12px sans-serif");
  ref.childNodes.forEach((child) => child.remove());
  svg.selectAll("*").remove();

  const types: string[] = Array.from(
    new Set(data.links.map((d: { event: string }) => d.event))
  );
  console.log(types);

  const color = d3.scaleOrdinal(types, d3.schemeCategory10);
  function linkArc(d: any) {
    const r = Math.hypot(d.target.x - d.source.x, d.target.y - d.source.y);
    return `
      M${d.source.x},${d.source.y}
      A${r},${r} 0 0,1 ${d.target.x},${d.target.y}
    `;
  }

  const links = data.links.map((d: any) => Object.create(d));
  const nodes = data.nodes.map((d: any) => Object.create(d));

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links).id((d: any) => d.id)
    )
    .force("charge", d3.forceManyBody().strength(function (d, i) {
      var a = i == 0 ? -2000 : -1000;
      return a;
  }).distanceMin(200).distanceMax(1000))
    .force("x", d3.forceX())
    .force("y", d3.forceY());

  svg
    .attr("viewBox", [-width / 4, -height / 4, width / 2, height / 2])
    .style("font", "12px sans-serif");

  // Per-type markers, as they don't inherit styles.
  svg
    .append("defs")
    .selectAll("marker")
    .data(types)
    .join("marker")
    .attr("id", (d) => `arrow-${d}`)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -0.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("fill", color)
    .attr("d", "M0,-5L10,0L0,5");

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", (d: any) => color(d.event))
    .attr(
      "marker-end",
      (d: any) => `url(${new URL(`#arrow-${d.event}`, location as any)})`
    );

  const node = svg
    .append("g")
    .attr("fill", "currentColor")
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .selectAll("g")
    .data(nodes)
    .join("g");
  // .call(drag(simulation));

  node
    .append("circle")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("r", 4);

  node
    .append("text")
    .attr("x", 8)
    .attr("y", "0.31em")
    .text((d: any) => d.id)
    .clone(true)
    .lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3);

  simulation.on("tick", () => {
    link.attr("d", linkArc);
    node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
  });

  ref.append(svg.node()!);
};

export const Diagram = ({ events = [] }: { events: any[] }) => {
  const [svgRef, setDivRef] = useState<HTMLDivElement>();

  const processEvents = async () => {
    const sortedEvents = events.filter((ev: any) => ev.execution).sort((a, b) => Number(a.sk) - Number(b.sk));
    const taskTokenSet = new Set<string>([]);
    sortedEvents.forEach((ev) => taskTokenSet.add(ev.TaskToken));

    const eventSources: any = {};
    const outgoing = new Set<string>([]);
    sortedEvents.forEach((ev) => {
      let eventSource: string;
      let eventSourceType: string;
      if (ev.meta?.fn) {
        eventSource = ev.meta?.fn;
        eventSourceType = "lambda";
      } else {
        const execSplit = ev.execution.split(":");
        eventSource = execSplit[execSplit.length - 2];
        eventSourceType = "step-function";
      }
      if (!Object.keys(eventSources).includes(eventSource)) {
        eventSources[eventSource] = {
          name: eventSource,
          type: eventSourceType,
          incoming: new Set<string>(
            eventSourceType === "step-function" ? ["task.finished"] : []
          ),
          outgoing: new Set<string>([]),
          account: ev.account,
        };
      }
      if (ev.meta) {
        eventSources[eventSource].incoming.add(ev.meta.incoming.detailType);
      }
      eventSources[eventSource].outgoing.add(
        `${ev.stateName}#${ev.detailType}`
      );
      outgoing.add(ev.detailType);
    });
    console.log(outgoing);
    const links = [...outgoing].reduce((p, c) => {
      const outSources = Object.keys(eventSources).filter((ev) => {
        return [...eventSources[ev].outgoing].filter((evOut: any) =>
          evOut.endsWith(c)
        ).length;
      });
      const inSources = Object.keys(eventSources).filter((ev) => {
        return [...eventSources[ev].incoming].filter((evIn: any) => evIn === c)
          .length;
      });
      const outLinks = outSources.reduce((op, oc) => {
        return [
          ...op,
          ...inSources.map((inSource) => ({
            source: oc,
            target: inSource,
            event: c,
          })),
        ];
      }, [] as any[]);
      return [...p, ...outLinks];
    }, [] as any);
    console.log(links);
    const data = {
      nodes: Array.from(
        new Set(links.flatMap((l: any) => [l.source, l.target])),
        (id) => ({ id })
      ),
      links,
    };
    console.log(data);
    buildGraph({ ref: svgRef!, data });
  };

  useEffect(() => {
    if (svgRef && events.length) {
      processEvents();
    }
  }, [events]);
  return (
    <div
      className="container"
      ref={(ref: HTMLDivElement) => setDivRef(ref)}
    ></div>
  );
};
