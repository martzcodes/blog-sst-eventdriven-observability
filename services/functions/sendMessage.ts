import { DynamoDB, ApiGatewayManagementApi } from "aws-sdk";
import { EventBridgeEvent } from "aws-lambda";

const TableName = process.env.tableName!;
const websocketUrl = process.env.websocketUrl!;
const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async (event: EventBridgeEvent<string, any>) => {
  const messageData = JSON.stringify({
    source: event.source,
    detailType: event["detail-type"],
    execution: event.detail.execution,
    detail: { meta: event.detail.meta },
  });
  console.log(`messageData: ${messageData}`);

  // Get all the connections
  const connections = await dynamoDb
    .query({
      TableName,
      ProjectionExpression: "sk",
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": "CONNECTION",
      },
    })
    .promise();

  console.log(`websocket url: ${websocketUrl.replace("wss://", "")}`);
  const apiG = new ApiGatewayManagementApi({
    endpoint: `${websocketUrl.replace("wss://", "")}`,
  });

  const postToConnection = async function ({ sk }: { sk: string }) {
    console.log(`connection id: ${sk}`);
    try {
      // Send the message to the given client
      await apiG
        .postToConnection({ ConnectionId: sk, Data: messageData })
        .promise();
    } catch (e: any) {
      console.log(`caught: ${e}`);
      if (e.statusCode === 410) {
        // Remove stale connections
        await dynamoDb
          .delete({ TableName, Key: { pk: "CONNECTION", sk } })
          .promise();
      }
    }
  };

  // Iterate through all the connections
  await Promise.all(
    (connections?.Items! as { sk: string }[]).map(postToConnection)
  );

  return { statusCode: 200, body: "Message sent" };
};
