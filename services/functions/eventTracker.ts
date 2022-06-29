import { DynamoDB } from "aws-sdk";
import { EventBridgeEvent } from "aws-lambda";
import type { PutItemInput } from "aws-sdk/clients/dynamodb";

const dynamoDb = new DynamoDB.DocumentClient();

export const parseExecution = (execution?: string) => {
  if (execution) {
    const splitExecution = execution.split(":");
    return splitExecution[splitExecution.length - 1];
  }
  return 'start';
}

export const handler = async (event: EventBridgeEvent<string, any>) => {
  const time = `${new Date().getTime()}`;
  const detail = { ... event.detail };
  const latestParams = {
    TableName: process.env.tableName,
    Item: {
      pk: `LATEST`,
      sk:`EVENT#${parseExecution(event.detail.execution)}`,
      latest: time,
      account: event.account,
      source: event.source,
      detailType: event['detail-type'],
      ttl: Math.ceil((new Date().getTime() + 24 * 60 * 60 * 1000) / 1000),
      ...detail,
    },
  };

  await dynamoDb.put(latestParams as PutItemInput).promise();

  const params = {
    TableName: process.env.tableName,
    Item: {
      pk: `EVENT#${parseExecution(event.detail.execution)}`,
      sk: time,
      account: event.account,
      source: event.source,
      detailType: event['detail-type'],
      ttl: Math.ceil((new Date().getTime() + 24 * 60 * 60 * 1000) / 1000),
      ...detail
    },
  };

  await dynamoDb.put(params as PutItemInput).promise();
};