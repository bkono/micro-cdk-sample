# Greeter

This repo exists to answer a few questions I'm frequently asked regarding usage of multi-step
builds, docker-compose, consul, and go-micro. Configuration is as follows:

- **api**, **greeter**, and **vip** have multi-step build files to compile in a container, and end with a minimal
    surface area (and size) container. Note: Generally I use a Makefile and arguments to dry up
    these files, but functionally it is the same process.
- Addition of [dep](https://github.com/golang/dep) for dependency resolution during container
    compilation. This is just an example for an approach that does not depend on committing the
    vendor directory, which I'm personally still on the fence about.
- **compose file** Root level docker-compose file for starting the full suite.
- **compose file** Integrates [consul](https://github.com/hashicorp/consul) *without* the use of host 
    mode networking or dev mode. This is one of the primary questions I field on a regular basis.
- **compose file** DNS resolution through consul for all apps. This allows a little inception of
    configuring the go-micro `-registry_address` to be `consul.service.consul` and knowing it will
    all Just Work™.
- **recent addition** srv -> srv communication example via greeter calling vip.

This example uses the api, parts of srv, and cli components from the official [micro greeter example](https://github.com/micro/examples/tree/master/greeter). For details on each component, please review the original.

## Contents

- **srv** - an RPC greeter service that consumes vip
- **vip** - another RPC service to demo srv -> srv communication
- **cli** - an RPC client that calls the service once
- **api** - examples of RPC API and RESTful API

## Run the suite

```
docker-compose up microapi
```

That's it. Seriously. The `microapi` block is configured with dependencies on all other components
to provide a simple entry point.

## Testing from the host

In the docker-compose file, `microapi` is bound to 8090 on the host. This allows for convenient curl
based testing.

```
❯ curl "localhost:8090/greeter/say/hello?name=John"
{"message":"Hello John"}
```

Log samples for the above request:
```
microapi_1  | 172.20.0.1 - - [21/Sep/2017:17:28:33 +0000] "GET /greeter/say/hello?name=John HTTP/1.1" 200 24 "" "curl/7.54.0"

api_1       | 2017/09/21 17:28:33 Received Say.Hello API request

srv_1       | 2017/09/21 17:28:33 Received Say.Hello request

vip_1       | 2017/09/21 17:28:23 Received VIP.CheckName request
vip_1       | 2017/09/21 17:28:23 is vip check false
```

consul is also launched with a ui, and bound to the host at 8500. Navigate to
`http://localhost:8500/ui` to view the current running services.
