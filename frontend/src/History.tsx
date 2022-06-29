import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Diagram } from "./Diagram";
import { Sankey } from "./incomplete/Sankey";
import { Table } from "./Table";
import { Timeline } from "./Timeline";

export const History = () => {
  let params = useParams();
  const [events, setEvents] = useState<any[]>([]);

  const getLatest = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_APP_API_URL}/job/${params.id}`
    );
    const data = await res.json();
    setEvents(data.events);
  };

  useEffect(() => {
    getLatest();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Diagram events={events}></Diagram>
        <Timeline events={events}></Timeline>
      </div>
      <div>
        <Table events={events}></Table>
      </div>
      <div className="col-span-2">
        <pre>{JSON.stringify(events, null, 2)}</pre>
      </div>
    </div>
  );
};
