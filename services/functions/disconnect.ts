import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import type { DeleteItemInput } from "aws-sdk/clients/dynamodb";

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = {
    TableName: process.env.tableName,
    Key: {
      pk: `CONNECTION`,
      sk: event.requestContext.connectionId,
    },
  };

  await dynamoDb.delete(params as DeleteItemInput).promise();

  return { statusCode: 200, body: "Disconnected" };
};
