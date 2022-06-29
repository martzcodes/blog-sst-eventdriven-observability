import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const Latest = () => {
  const [jobs, setJobs] = useState<any[]>([]);

  const getLatest = async () => {
    const res = await fetch(`${import.meta.env.VITE_APP_API_URL}/latest`);
    const data = await res.json();
    setJobs(
      data.latest.sort((a: any, b: any) => Number(b.latest) - Number(a.latest))
    );
  };

  useEffect(() => {
    getLatest();
  }, []);
  return (
    <div>
      <h1>Most recent at the top</h1>
      <table className="table-auto">
        <thead>
          <tr>
            <th>Date</th>
            <th>State Machine</th>
            <th>Job</th>
            <th>Last Event</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.job}>
              <td>{new Date(Number(job.latest)).toISOString()}</td>
              <td>{job.meta?.stateMachine}</td>
              <td>
                <Link
                  to={`/history/${job.meta?.job}`}
                  className="no-underline hover:underline"
                >
                  {job.meta?.job}
                </Link>
              </td>
              <td>
                {job.meta?.incoming?.detailType} -{">"}{" "}
                {job.meta?.outgoing?.detailType}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <pre>{JSON.stringify(jobs, null, 2)}</pre> */}
    </div>
  );
};
