import { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { Diagram } from "./Diagram";
import { Table } from "./Table";
import { Timeline } from "./Timeline";

export const Home = () => {
  const socketUrl = import.meta.env.VITE_SOCKET_API_URL;
  const [messageHistory, setMessageHistory] = useState<MessageEvent<any>[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const { lastMessage, readyState } = useWebSocket(socketUrl);

  useEffect(() => {
    if (lastMessage !== null) {
      setMessageHistory((prev) => prev.concat(lastMessage));
      setEvents([]);
      setEvents(
        [...messageHistory, lastMessage].map((ev) => JSON.parse(ev.data))
      );
    }
  }, [lastMessage, setMessageHistory]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Connected",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <div>
      <span>The WebSocket is currently {connectionStatus}</span>
      <div className="grid grid-cols-2 gap-4">
        {events.length ? (
          <div>
            <Diagram events={events}></Diagram>
            <Timeline events={events}></Timeline>
          </div>
        ) : (
          <></>
        )}
        {events.length ? (
          <div>
            <Table events={events}></Table>
          </div>
        ) : (
          <></>
        )}
        <div className="col-span-2">
          {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
          <ul>
            {messageHistory.map((message: any, idx) => (
              <span key={idx}>{message ? message.data : null}</span>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
