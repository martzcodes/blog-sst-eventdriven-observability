import { StackContext, Api, Table, ViteStaticSite, WebSocketApi, EventBus } from "@serverless-stack/resources";
import { RemovalPolicy } from "aws-cdk-lib";
import { EventBus as CdkEventBus } from "aws-cdk-lib/aws-events";

export function MyStack({ stack }: StackContext) {
  const table = new Table(stack, "EventDrivenObservability", {
    fields: {
      pk: "string",
      sk: "string",
      ttl: "number",
    },
    timeToLiveAttribute: "ttl",
    primaryIndex: { partitionKey: "pk", sortKey: "sk", },
    cdk: {
      table: {
        removalPolicy: RemovalPolicy.DESTROY,
      }
    }
  });

  const socketApi = new WebSocketApi(stack, "SocketApi", {
    defaults: {
      function: {
        environment: {
          tableName: table.tableName,
        },
      },
    },
    routes: {
      $connect: "functions/connect.handler",
      $disconnect: "functions/disconnect.handler",
    },
  });
  socketApi.attachPermissions([table]);

  const bus = new EventBus(stack, "Ordered", {
    cdk: {
      eventBus: CdkEventBus.fromEventBusName(stack, `DefaultBus`, "default"),
    },
    defaults: {
      function: {
        environment: {
          tableName: table.tableName,
          websocketUrl: socketApi.url
        },
      },
    },
    rules: {
      observer: {
        pattern: {
          source: ['project']
        },
        targets: {
          sendMessage: "functions/sendMessage.handler",
          eventTracker: "functions/eventTracker.handler",
        },
      },
    },
  });
  bus.attachPermissions([table, socketApi]);

  const api = new Api(stack, "Api", {
    defaults: {
      function: {
        // Allow the API to access the table
        permissions: [table],
        // Pass in the table name to our API
        environment: {
          tableName: table.tableName,
        },
      },
    },
    routes: {
      "GET /latest": "functions/getLatestEvents.handler",
      "GET /job/{id}": "functions/getJobEvents.handler",
    },
  });
  
  // Allow the API to access the table
  api.attachPermissions([table]);
  
  
  const site = new ViteStaticSite(stack, "SvelteJSSite", {
    path: "frontend",
    environment: {
      // Pass in the API endpoint to our app
      VITE_APP_API_URL: api.url,
      VITE_SOCKET_API_URL: socketApi.url,
    },
  });
  
  // Show the URLs in the output
  stack.addOutputs({
    SiteUrl: site.url,
    ApiEndpoint: api.url,
    WebsocketApiEndpoint: socketApi.url,
  });
}
