#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import {InfraStack} from '../lib/infra-stack';

const app = new cdk.App();
new InfraStack(app, 'DevInfraStack');
