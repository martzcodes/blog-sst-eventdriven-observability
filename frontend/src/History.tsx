import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as d3 from "d3";

const buildGraph = ({
  ref,
  data,
  range,
  minTime,
  maxTime,
}: {
  ref: SVGSVGElement;
  data: Array<any>;
  range: number;
  minTime: number;
  maxTime: number;
}) => {
  const width = 1000,
    xScaleFactor = width / range,
    barHeight = 20;
  const filteredData = data.filter((d) => d.start && d.end);

  const graph = d3
    .select(ref)
    .attr("width", width)
    .attr("height", barHeight * filteredData.length);

  const bar = graph
    .selectAll("g")
    .data(filteredData)
    .enter()
    .append("g")
    .attr("transform", function (d, i) {
      return "translate(0," + i * barHeight + ")";
    });

  bar
    .append("rect")
    .attr("x", (d) => (d.start - minTime) * xScaleFactor)
    .attr("width", function (d) {
      return (d.end - d.start) * xScaleFactor;
    })
    .attr("height", barHeight - 1);

  bar
    .append("text")
    .attr("x", function (d) {
      return (d.end - minTime) * xScaleFactor;
    })
    .attr("y", barHeight / 2)
    .attr("dy", ".35em")
    .text(function (d) {
      return `${d.TaskToken}: ${d.meta?.incoming?.detailType} - ${d.meta?.outgoing?.detailType}`;
    });
};

export const History = () => {
  let params = useParams();
  console.log(params);
  const [svgRef, setSvgRef] = useState<SVGSVGElement>();
  const [events, setEvents] = useState<any[]>([]);
  const [steps, setSteps] = useState<string[]>([]);
  const [startTimes, setStartTimes] = useState<any>({});
  const [friendlyTaskTokens, setFriendlyTaskTokens] = useState<any>({});

  const getLatest = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_APP_API_URL}/job/${params.id}`
    );
    const data = await res.json();
    const states = data.events.filter((ev: any) => !ev.meta);
    console.log(states);
    const taskTokens = states.reduce((p: any, c: any, ind: number) => {
      return { ...p, [c.TaskToken]: ind };
    }, {} as any);
    setFriendlyTaskTokens(taskTokens);
    const starts = data.events.reduce((p: any, c: any) => {
      return {
        ...p,
        [`${taskTokens[c.TaskToken]}-${c.detailType}`]: Number(c.sk),
      };
    }, {});
    let minTime = Infinity;
    let maxTime = 0;
    const stepSet = new Set<string>([]);
    const friendlyEvents = data.events
      .map((ev: any) => {
        ev.TaskToken = taskTokens[ev.TaskToken];
        if (ev.meta?.incoming) {
          ev.start =
            starts[`${ev.TaskToken}-${ev.meta.incoming.detailType}`] / 1000;
          ev.end = Number(ev.sk) / 1000;
        }
        if (Number(ev.sk) < minTime) {
          minTime = Number(ev.sk) / 1000;
        }
        if (Number(ev.sk) > maxTime) {
          maxTime = Number(ev.sk) / 1000;
        }
        stepSet.add(ev.stateName);
        return ev;
      })
      .sort((a: any, b: any) => {
        return a.start - b.start;
      });
    setEvents(friendlyEvents);
    setSteps([...stepSet]);
    if (svgRef) {
      buildGraph({
        ref: svgRef,
        data: friendlyEvents,
        range: maxTime - minTime,
        minTime,
        maxTime,
      });
    }
  };

  useEffect(() => {
    getLatest();
  }, []);
  return (
    <div>
      <svg
        className="container"
        ref={(ref: SVGSVGElement) => setSvgRef(ref)}
        width="100"
        height="100"
      ></svg>
      <table className="table-auto">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Duration (seconds)</th>
            <th>Step</th>
            <th>Incoming</th>
            <th>Outgoing</th>
            <th>TaskToken</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.sk}>
              <td>{ev.start}</td>
              <td>{ev.end || Number(ev.sk)}</td>
              <td>{ev.start && ev.end ? ev.end - ev.start : ""}</td>
              <td>{ev.stateName}</td>
              <td>{ev.meta?.incoming?.detailType}</td>
              <td>{ev.detailType}</td>
              <td>{ev.TaskToken}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <pre>{JSON.stringify(events, null, 2)}</pre>
    </div>
  );
};
