module github.com/bkono/micro-cdk-sample/api

go 1.12

require (
	github.com/99designs/gqlgen v0.7.2 // indirect
	github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello v0.0.0-00010101000000-000000000000
	github.com/bkono/micro-plugins v0.1.4
	github.com/emicklei/go-restful v2.8.1+incompatible
	github.com/golang/protobuf v1.3.1
	github.com/micro/examples v0.1.0
	github.com/micro/go-micro v1.1.0
	github.com/micro/go-web v0.6.0
	github.com/micro/micro v1.1.1
	golang.org/x/net v0.0.0-20190419010253-1f3472d942ba
	k8s.io/utils v0.0.0-20190204185745-a326ccf4f02b // indirect
)

replace github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello => ../greeter-srv/proto/hello
