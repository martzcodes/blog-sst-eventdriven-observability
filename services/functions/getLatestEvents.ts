import { DynamoDB } from "aws-sdk";

const TableName = process.env.tableName!;
const dynamoDb = new DynamoDB.DocumentClient();

export const handler = async () => {

  // Get all the connections
  const latestJobs = await dynamoDb
    .query({
      TableName,
      KeyConditionExpression: "#pk = :pk",
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      ExpressionAttributeValues: {
        ":pk": "LATEST",
      },
    })
    .promise();

  return { statusCode: 200, body: JSON.stringify({ latest: latestJobs.Items }) };
};
