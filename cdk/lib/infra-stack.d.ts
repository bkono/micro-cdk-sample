import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');
import ecs = require('@aws-cdk/aws-ecs');
export declare class SrvStack extends cdk.Construct {
    readonly service: ecs.FargateService;
    constructor(scope: cdk.Construct, id: string, props: SrvStackProps);
}
export declare class InfraStack extends cdk.Stack {
    readonly vpc: ec2.VpcNetwork;
    readonly cluster: ecs.Cluster;
    readonly serviceDiscoveryDomain: string;
    readonly serviceSG: ec2.SecurityGroup;
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps);
}
interface SrvStackProps {
    cluster: ecs.Cluster;
    name: string;
    image: string;
    fromPath?: boolean;
    commandOverride?: string[];
    useLoadBalancer?: boolean;
    lbHealthCheckPath?: string;
    lbContainerPort?: number;
    serviceSG: ec2.SecurityGroup;
    serviceDiscoveryDomain: string;
    envVars?: {
        [key: string]: string;
    };
}
export {};
