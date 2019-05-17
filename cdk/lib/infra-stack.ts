import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import ecs = require('@aws-cdk/aws-ecs');
// import sd = require('@aws-cdk/aws-servicediscovery');
import iam = require('@aws-cdk/aws-iam');
import { EcrImage, ContainerDefinition } from '@aws-cdk/aws-ecs';
import { Task } from '@aws-cdk/aws-stepfunctions';

export class SrvStack extends cdk.Construct {
  public readonly service: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props: SrvStackProps) {
    super(scope, id)

    if (props.useLoadBalancer && !props.lbContainerPort) {
      throw new cdk.ValidationError(this, 'lbContainerPort is required when setting useLoadBalancer to true');
    }

    let image: ecs.ContainerImage;
    if (props.fromPath) {
      image = ecs.ContainerImage.fromAsset(
        this, `${props.name}SrvImage`, { directory: props.image });
      new cdk.CfnOutput(this, `${props.name}ECRImage`, { value: image.imageName })
    } else {
      image = ecs.ContainerImage.fromRegistry(props.image);
    }

    const envs = props.envVars || {}
    if (props.cluster.defaultNamespace) {
      envs['MICRO_REGISTRY'] = 'cloudmap';
      envs['MICRO_CLOUDMAP_DOMAIN'] = props.cluster.defaultNamespace.namespaceName;
      envs['MICRO_CLOUDMAP_NAMESPACEID'] = props.cluster.defaultNamespace.namespaceId;
    }

    const def =
      new ecs.FargateTaskDefinition(this, `${props.name}SrvTaskDefinition`);
    const container = def.addContainer('srv', {
      image: image,
      logging: new ecs.AwsLogDriver(
        this, 'TaskLogging', { streamPrefix: `${props.name}-log-` }),
      command: props.commandOverride ? props.commandOverride : undefined,
      environment: envs
    });
    def.addToTaskRolePolicy(newSDIAMPolicy())

    const srv = this.service = new ecs.FargateService(this, `${props.name}Service`, {
      cluster: props.cluster,
      taskDefinition: def,
      securityGroup: props.serviceSG ? props.serviceSG : undefined,
      serviceDiscoveryOptions:
        { name: props.name, dnsTtlSec: 30, failureThreshold: 2 }
    });


    if (props.useLoadBalancer) {
      container.addPortMappings({
        containerPort: props.lbContainerPort || 80,
      })
      const lb = new elbv2.ApplicationLoadBalancer(
        this, 'LB', { internetFacing: true, vpc: props.cluster.vpc });
      const listener = lb.addListener('PublicListener', { port: 80, open: true });
      const tg = listener.addTargets('FargateCluster', { port: 80 });
      if (props.lbHealthCheckPath) {
        tg.configureHealthCheck({ path: props.lbHealthCheckPath });
      }
      tg.addTarget(srv)
      new cdk.CfnOutput(
        this, `${props.name}LoadBalancerDNS`, { value: lb.dnsName })
    }
  }
}

export class InfraStack extends cdk.Stack {
  public readonly vpc: ec2.VpcNetwork;
  public readonly cluster: ecs.Cluster;
  public readonly serviceDiscoveryDomain: string;
  public readonly serviceSG: ec2.SecurityGroup;

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpc = this.vpc = new ec2.VpcNetwork(this, 'Vpc', { natGateways: 1, maxAZs: 2 });
    this.serviceDiscoveryDomain = 'microcdk.int';
    this.cluster = new ecs.Cluster(this, 'FargateCluster', { vpc });
    this.cluster.addDefaultCloudMapNamespace(
      { name: this.serviceDiscoveryDomain });

    this.serviceSG = new ec2.SecurityGroup(
      this, 'ServiceSG', { allowAllOutbound: true, vpc });
    this.serviceSG.connections.allowInternally(new ec2.TcpAllPorts);
    this.serviceSG.connections.allowInternally(new ec2.UdpAllPorts);

    // micro api is core infrastructure, building here
    const microImage = ecs.ContainerImage.fromAsset(
      this, 'MicroApiImage', { directory: '../microapi' });
    new cdk.CfnOutput(this, 'MicroApiECRRepo', { value: microImage.imageName });

    // const microapi =
    //   new ecs.LoadBalancedFargateService(this, 'MicroApiService', {
    //     cluster: this.cluster,
    //     image: microImage,
    //     containerPort: 8090,
    //     environment: {
    //       'MICRO_API_HANDLER': 'api',
    //       'MICRO_API_ADDRESS': '0.0.0.0:8090',
    //       'MICRO_REGISTRY': 'cloudmap',
    //       'MICRO_CLOUDMAP_DOMAIN': this.cluster.defaultNamespace!.namespaceName,
    //       'MICRO_CLOUDMAP_NAMESPACEID': this.cluster.defaultNamespace!.namespaceId,
    //     }
    //   });

    const microapi = new SrvStack(this, 'MicroAPI', {
      name: 'microapi',
      cluster: this.cluster,
      serviceSG: this.serviceSG,
      fromPath: true,
      image: '../microapi',
      lbContainerPort: 8090,
      useLoadBalancer: true,
      lbHealthCheckPath: "/stats",
      serviceDiscoveryDomain: this.serviceDiscoveryDomain,
      envVars: { 'MICRO_API_ADDRESS': '0.0.0.0:8090' },
    });

    this.serviceSG.connections.allowFrom(microapi.service, new ec2.TcpAllPorts);

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new cdk.CfnOutput(this, 'ClusterARN', { value: this.cluster.clusterArn });
  }
}

// create an EcrImage

// PipelineTemplate {
//   Params: take an ECR image, take a fargate taskarn, cluster arn
//   create a codepipeline
//   GithubSource Stage
//   Build Stage: push to the EcrImage (buildspec.yml)
//   Deploy Stage: deploy to a fargate task
// }

// FargateServiceTemplate {
//   take an ECR EcrImage
//   create the Task
//   create the ContainerDefinition
//   create service
// }
// }


interface SrvStackProps {
  cluster: ecs.Cluster
  name: string
  image: string
  fromPath?: boolean
  commandOverride?: string[]
  useLoadBalancer?: boolean
  lbHealthCheckPath?: string
  lbContainerPort?: number
  serviceSG: ec2.SecurityGroup
  serviceDiscoveryDomain: string
  envVars?: { [key: string]: string }
}

function newSDIAMPolicy(): iam.PolicyStatement {
  return new iam.PolicyStatement(iam.PolicyStatementEffect.Allow)
    .addActions(
      "servicediscovery:CreateService",
      "servicediscovery:DeleteService",
      "servicediscovery:DeregisterInstance",
      "servicediscovery:DiscoverInstances",
      "servicediscovery:GetInstance",
      "servicediscovery:GetInstancesHealthStatus",
      "servicediscovery:GetNamespace",
      "servicediscovery:GetOperation",
      "servicediscovery:GetService",
      "servicediscovery:ListInstances",
      "servicediscovery:ListNamespaces",
      "servicediscovery:ListOperations",
      "servicediscovery:ListServices",
      "servicediscovery:RegisterInstance",
      "servicediscovery:UpdateInstanceCustomHealthStatus",
      "servicediscovery:UpdateService",
      "route53:GetHealthCheck",
      "route53:DeleteHealthCheck",
      "route53:DeleteHealthCheck",
      "route53:UpdateHealthCheck",
      "route53:ChangeResourceRecordSets",
    ).addAllResources()
}