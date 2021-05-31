import * as sst from "@serverless-stack/resources";
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as iam from '@aws-cdk/aws-iam';


export default class MyStack extends sst.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //  add permissions for edge lambda ( role must be assumable with edgelambda.amazonaws.com as well as lambda.amazonaws.com principals)
    new iam.PolicyStatement({
      actions: ["sts:AssumeRole"],
      effect: iam.Effect.ALLOW,
      "Principal": {
        "Service": [ "edgelambda.amazonaws.com", "lambda.amazonaws.com" ]
      }
      
    })

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
      routes: {
        "POST /": {
          function: {
            srcPath: "src/",
            handler: "lambda.main",
            memorySize: 128,
            timeout: 5,
          },
        },
      },
    });

    const myFunc = api.getFunction("POST /");


    new cloudfront.Distribution(this, 'myDist', {
      defaultBehavior: {
        origin: new origins.HttpOrigin('app.abduls-cloudfront-dist.com'),
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
