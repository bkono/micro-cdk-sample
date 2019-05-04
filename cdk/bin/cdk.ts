#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { InfraStack, SrvStack } from '../lib/infra-stack';

const app = new cdk.App();
const infra = new InfraStack(app, 'DevInfraStack');
new SrvStack(infra, 'VipSrv', {
  name: 'vip',
  cluster: infra.cluster,
  serviceSG: infra.serviceSG,
  fromPath: true,
  image: '../vip-srv',
  useLoadBalancer: false,
  serviceDiscoveryDomain: infra.serviceDiscoveryDomain,
  envVars: { 'MICRO_SERVER_ADDRESS': ':4000' },
});

new SrvStack(infra, 'GreeterSrv', {
  name: 'greeter',
  cluster: infra.cluster,
  serviceSG: infra.serviceSG,
  fromPath: true,
  image: '../greeter-srv',
  useLoadBalancer: false,
  serviceDiscoveryDomain: infra.serviceDiscoveryDomain,
  envVars: { 'MICRO_SERVER_ADDRESS': ':4000' },
});

new SrvStack(infra, 'Api', {
  name: 'api',
  cluster: infra.cluster,
  serviceSG: infra.serviceSG,
  fromPath: true,
  image: '../api',
  useLoadBalancer: false,
  serviceDiscoveryDomain: infra.serviceDiscoveryDomain,
  envVars: { 'MICRO_SERVER_ADDRESS': ':4000' },
});
