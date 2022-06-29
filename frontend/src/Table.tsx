import { useEffect, useState } from "react";

const formatDate = (d: any) => {
  const date = new Date(d * 1000);
  return `${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}:${(date.getSeconds()<10?'0':'') + date.getSeconds()}`;
};

export const Table = ({ events = [] }: { events: any[]}) => {
  const [taskTokens, setTaskTokens] = useState<Record<string, string>>({});
  const [tableEvents, setTableEvents] = useState<any>([]);
  
  const processEvents = async () => {
    const states = events.filter((ev: any) => !ev.meta);
    const tokens = states.reduce((p: any, c: any, ind: number) => {
      return { ...p, [c.TaskToken]: ind };
    }, {} as any);
    setTaskTokens(tokens);
    const starts = events.reduce((p: any, c: any) => {
      return {
        ...p,
        [`${tokens[c.TaskToken]}-${c.detailType}`]: Number(c.sk),
      };
    }, {});
    const stepSet = new Set<string>([]);
    const friendlyEvents = events.filter((ev: any) => ev.meta?.incoming?.detailType)
      .map((ev: any) => {
        const output = {...ev};
        output.TaskToken = tokens[output.TaskToken];
        if (output.meta?.incoming) {
          output.start =
            starts[`${output.TaskToken}-${output.meta.incoming.detailType}`] / 1000;
          output.end = Number(output.sk) / 1000;
        }
        stepSet.add(output.stateName);
        return output;
      })
      .sort((a: any, b: any) => {
        return Number(a.TaskToken) - Number(b.TaskToken);
      });
    setTableEvents([...friendlyEvents]);
  };

  useEffect(() => {
    if (events.length) {
      processEvents();
    }
  }, [events]);
  return (
    <div>
      <table className="table-auto">
        <thead>
          <tr>
            <th>Start</th>
            <th>End</th>
            <th>Duration (s)</th>
            <th>Step</th>
            <th>Incoming</th>
            <th>Outgoing</th>
            <th>TaskToken</th>
          </tr>
        </thead>
        <tbody>
          {tableEvents.filter((ev: any) => ev.start && ev.end).map((ev: any) => (
            <tr key={ev.sk}>
              <td>{ev.start ? formatDate(ev.start) : ""}</td>
              <td>{formatDate(ev.end || Number(ev.sk))}</td>
              <td>{ev.start && ev.end ? Math.round((ev.end - ev.start)*100)/100 : ""}</td>
              <td>{ev.stateName}</td>
              <td>{ev.meta?.incoming?.detailType}</td>
              <td>{ev.detailType}</td>
              <td>{taskTokens[ev.TaskToken] || (`${ev.TaskToken}`.length < 5 ? ev.TaskToken : '')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
