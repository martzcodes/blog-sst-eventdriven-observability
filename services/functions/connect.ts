import { DynamoDB } from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import type { PutItemInput } from "aws-sdk/clients/dynamodb";

const dynamoDb = new DynamoDB.DocumentClient();

export const handler: APIGatewayProxyHandler = async (event) => {
  const params = {
    TableName: process.env.tableName,
    Item: {
      pk: `CONNECTION`,
      sk: event.requestContext.connectionId,
      ttl: Math.ceil((new Date().getTime() + 24 * 60 * 60 * 1000) / 1000),
    },
  };

  await dynamoDb.put(params as PutItemInput).promise();

  return { statusCode: 200, body: "Connected" };
};