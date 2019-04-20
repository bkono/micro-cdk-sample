import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import ecs = require('@aws-cdk/aws-ecs');
import sd = require('@aws-cdk/aws-servicediscovery');

export class SrvStack extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: SrvStackProps) {
    super(scope, id)

    let image: ecs.ContainerImage;
    if (props.fromPath) {
      image = ecs.ContainerImage.fromAsset(
          this, `${props.name}SrvImage`, {directory: props.image});
    } else {
      image = ecs.ContainerImage.fromRegistry(props.image);
    }

    const def =
        new ecs.FargateTaskDefinition(this, `${props.name}SrvTaskDefinition`);
    def.addContainer('srv', {
      image: image,
      command: props.commandOverride ? [props.commandOverride] : undefined,
      environment: props.envVars
    });

    const srv = new ecs.FargateService(this, `${props.name}Service`, {
      cluster: props.cluster,
      taskDefinition: def,
      serviceDiscoveryOptions:
          {name: props.name, dnsTtlSec: 30, failureThreshold: 2}
    });

    if (props.useLoadBalancer) {
      const lb = new elbv2.ApplicationLoadBalancer(
          this, 'LB', {internetFacing: true, vpc: props.cluster.vpc});
      const listener = lb.addListener('PublicListener', {port: 80, open: true});
      const tg = listener.addTargets('FargateCluster', {port: 80});
      srv.attachToApplicationTargetGroup(tg);
      new cdk.CfnOutput(
          this, `${props.name}LoadBalancerDNS`, {value: lb.dnsName})
    }
  }
}

export class InfraStack extends cdk.Stack {
  public readonly vpc: ec2.VpcNetwork;
  public readonly cluster: ecs.Cluster;
  public readonly sdNamespace: sd.Namespace;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.VpcNetwork(this, 'Vpc', {natGateways: 1, maxAZs: 2});
    this.cluster = new ecs.Cluster(this, 'FargateCluster', {vpc: this.vpc});
    this.sdNamespace = new sd.PrivateDnsNamespace(
        this, 'MicroCDKNamespace', {vpc: this.vpc, name: 'microcdk.int'});


    // micro api is core infrastructure, building here
    // const microapi =
    //     new ecs.LoadBalancedFargateService(this, 'MicroApiService', {
    //       cluster: this.cluster,
    //       image: ecs.ContainerImage.fromRegistry('microhq/micro'),
    //       containerPort: 8090,
    //       environment:
    //           {'MICRO_API_HANDLER': 'api', 'MICRO_API_ADDRESS':
    //           '0.0.0.0:8090'}

    //     });

    new SrvStack(this, 'MicroApiService', {
      name: 'microapi',
      cluster: this.cluster,
      commandOverride: 'api',
      image: 'microhq/micro',
      containerPort: 8090,
      useLoadBalancer: true,
      envVars: {'MICRO_API_HANDLER': 'api', 'MICRO_API_ADDRESS': '0.0.0.0:8090'}
    });
    new cdk.CfnOutput(this, 'VpcId', {value: this.vpc.vpcId});
    new cdk.CfnOutput(this, 'ClusterARN', {value: this.cluster.clusterArn});
  }
}

interface SrvStackProps {
  cluster: ecs.Cluster
  name: string
  image: string
  fromPath?: boolean
  commandOverride?: string
  useLoadBalancer?: boolean
  containerPort: number
  envVars?: {[key: string]: string}
}
