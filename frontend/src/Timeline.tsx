import { useEffect, useState } from "react";
import * as d3 from "d3";

const margin = { top: 30, right: 30, bottom: 30, left: 30 };
const formatName = (d: any) => `${d.meta?.incoming?.detailType}`;
const formatDate = (d: any) => {
  const date = new Date(d * 1000);
  return `${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}:${(date.getSeconds()<10?'0':'') + date.getSeconds()}`;
};
const formatColor = (d: any) => `${d.execution}.${d.meta.incoming.detailType}.${d.meta.outgoing.detailType}`;

const buildGraph = ({
  ref,
  data,
  height,
}: {
  ref: SVGSVGElement;
  data: Array<any>;
  height: number;
}) => {
  const svg = d3.select(ref);
  ref.childNodes.forEach((child) => child.remove());
  svg.selectAll('*').remove();
  const width = 1000;

  const x = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.start), d3.max(data, (d) => d.end)])
    .range([0, width - margin.left - margin.right]);
  const y = d3
    .scaleBand<number>()
    .domain(d3.range(data.length) as any)
    .range([0, height - margin.bottom - margin.top])
    .padding(0.2);

  const createTooltip = (el: any) => {
    el.style("position", "absolute")
      .style("pointer-events", "none")
      .style("top", 0)
      .style("opacity", 0)
      .style("background", "white")
      .style("border-radius", "5px")
      .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
      .style("padding", "10px")
      .style("line-height", "1.3")
      .style("font", "11px sans-serif");
  };

  const getTooltipContent = (d: any) => {
    return `<b>${formatName(d)}</b>
    <br/>
        <b>Step Name: ${d.stateName}</b>    
    <br/>
        <b>Task Token: ${d.TaskToken}</b>
        <br/>
        <b>Invoked Event: ${d.meta?.incoming?.detailType}</b>
        <br/>
        <b style="color:${d.color.darker()}">Emitted Event: ${d.detailType}</b>
        <br/>
        Timing: ${d.start} - ${d.end}
        <br/>
        Duration: ${d.end - d.start}
        `;
  };

  const axisTop = d3.axisTop(x).tickPadding(2).tickFormat(formatDate);

  const axisBottom = d3.axisBottom(x).tickPadding(2).tickFormat(formatDate);

  const g = svg
    .append("g")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", (d, i) => `translate(${margin.left} ${margin.top})`);

  const tooltip = d3.select(document.createElement("div")).call(createTooltip);

  const line = svg
    .append("line")
    .attr("y1", margin.top - 10)
    .attr("y2", height - margin.bottom)
    .attr("stroke", "rgba(0,0,0,0.2)")
    .style("pointer-events", "none");

  const groups = g.selectAll("g").data(data).enter().append("g");
  groups.attr("transform", (d, i) => `translate(0 ${y(i)})`);

  groups
    .each(function (d: any) {
      const el = d3.select(this);
      const sx = x(d.start);
      const w = x(d.end) - x(d.start);
      const isLabelRight = sx > width / 2 ? sx + w < width : sx - w > 0;

      el.style("cursor", "pointer");

      el.append("rect")
        .attr("x", sx)
        .attr("height", y.bandwidth())
        .attr("width", w)
        .attr("fill", d.color);

      el.append("text")
        .text(
          formatName(d)
        )
        .attr("x", isLabelRight ? sx - 5 : sx + w + 5)
        .attr("y", 2.5)
        .attr("fill", "black")
        .style("text-anchor", isLabelRight ? "end" : "start")
        .style("dominant-baseline", "hanging");
    })
    .on("mouseover", function (d: MouseEvent) {
      let elem: any;
      d3.select(this)
        .select("rect")
        .attr("fill", (el: any) => {
          elem = el;
          return el.color.darker();
        });

      tooltip.style("opacity", 1).html(() => {
        return getTooltipContent(elem);
      });
    })
    .on("mouseleave", function (d) {
      d3.select(this)
        .select("rect")
        .attr("fill", (el: any) => {
          return el.color;
        });
      tooltip.style("opacity", 0);
    });

  svg.on("mousemove", function (d) {
    let [x, y] = d3.pointer(d);
    line.attr("transform", `translate(${x} 0)`);
    y += 20;
    if (x > width / 2) x -= 100;

    const box = svg.node()?.getBoundingClientRect();
    tooltip.style("left", (x + (box?.x || 0) + window.scrollX) + "px").style("top", (y + (box?.y || 0) + window.scrollY) + "px");
  });

  svg
    .append("g")
    .attr("transform", (d, i) => `translate(${margin.left} ${margin.top - 10})`)
    .call(axisTop);

  svg
    .append("g")
    .attr(
      "transform",
      (d, i) => `translate(${margin.left} ${height - margin.bottom})`
    )
    .call(axisBottom);

  ref.parentNode!.append(tooltip.node()!);
};

export const Timeline = ({ events = [] }: { events: any[]}) => {
  const [svgHeight, setSvgHeight] = useState(100);
  const [svgRef, setSvgRef] = useState<SVGSVGElement>();
  
  const processEvents = async () => {
    const states = events.filter((ev: any) => !ev.meta);
    const taskTokens = states.reduce((p: any, c: any, ind: number) => {
      return { ...p, [c.TaskToken]: ind };
    }, {} as any);
    const starts = events.reduce((p: any, c: any) => {
      return {
        ...p,
        [`${taskTokens[c.TaskToken]}-${c.detailType}`]: Number(c.sk),
      };
    }, {});
    const stepSet = new Set<string>([]);
    const detailTypes = events.filter((ev: any) => ev.meta?.incoming?.detailType).map((ev: any) => formatColor(ev));
    const color = d3.scaleOrdinal(d3.schemeSet2).domain(detailTypes);
    const friendlyEvents = events.filter((ev: any) => ev.meta?.incoming?.detailType)
      .map((ev: any) => {
        const output = {...ev};
        output.TaskToken = taskTokens[output.TaskToken];
        if (output.meta?.incoming) {
          output.start =
            starts[`${output.TaskToken}-${output.meta.incoming.detailType}`] / 1000;
          output.end = Number(output.sk) / 1000;
        }
        stepSet.add(output.stateName);
        output.color = d3.color(color(formatColor(ev)));
        return output;
      })
      .sort((a: any, b: any) => {
        return Number(a.TaskToken) - Number(b.TaskToken);
      });
      const height = friendlyEvents.length * 20 + margin.top + margin.bottom;
      setSvgHeight(height);
      buildGraph({
        ref: svgRef!,
        data: friendlyEvents,
        height,
      });
  };

  useEffect(() => {
    if (events.length && svgRef) {
      processEvents();
    }
  }, [svgRef, events]);
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
