import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const TableName = process.env.tableName!;
const dynamoDb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  // Get all the connections
  const jobEvents = await dynamoDb
    .query({
      TableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": `EVENT#${event.pathParameters!.id}`,
      },
    })
    .promise();

    console.log(JSON.stringify(jobEvents));
  return { statusCode: 200, body: JSON.stringify({ events: jobEvents.Items }) };
};
