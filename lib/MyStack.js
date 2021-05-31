import * as sst from "@serverless-stack/resources";
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';

export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create the table
    const table = new sst.Table(this, "Counter", {
      fields: {
        counter: sst.TableFieldType.STRING,
      },
      primaryIndex: { partitionKey: "counter" },
      dynamodbTable: {
        replicationRegions: ["eu-west-1", "ap-south-1"],
      },
    });

    // Create the HTTP API
    const api = new sst.Api(this, "Api", {
      defaultFunctionProps: {
        // Pass in the table name to our API
        environment: {
          tableName: table.dynamodbTable.tableName,
        },
      },
      routes: {
        "POST /": "src/lambda.main",
      },
    });

    const myFunc = api.getFunction("POST /");


    new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('https://app.abduls-cloudfront-dist.com'),
        edgeLambdas: [
          {
            functionVersion: myFunc.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
          }
        ],
      },
    });

    // Allow the API to access the table
    api.attachPermissions([table]);

       // Show the API endpoint in the output
       this.addOutputs({
        ApiEndpoint: api.url,
      });
  }

  
}
