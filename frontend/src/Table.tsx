import { useEffect, useState } from "react";

const formatDate = (d: any) => {
  const date = new Date(d * 1000);
  return `${date.getHours()}:${(date.getMinutes()<10?'0':'') + date.getMinutes()}:${(date.getSeconds()<10?'0':'') + date.getSeconds()}`;
};

export const Table = ({ events = [] }: { events: any[]}) => {
  const [taskTokens, setTaskTokens] = useState<Record<string, string>>({})
  
  const processEvents = async () => {
    const states = events.filter((ev: any) => !ev.meta);
    const taskTokens = states.reduce((p: any, c: any, ind: number) => {
      return { ...p, [c.TaskToken]: ind };
    }, {} as any);
    setTaskTokens(taskTokens);
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
          {events.filter((ev: any) => ev.start && ev.end).map((ev) => (
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
