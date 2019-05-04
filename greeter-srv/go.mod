module github.com/bkono/micro-cdk-sample/greeter-srv

go 1.12

require (
	github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello v0.0.0-00010101000000-000000000000
	github.com/bkono/micro-cdk-sample/vip-srv/proto/vip v0.0.0-00010101000000-000000000000
	github.com/bkono/micro-plugins v0.1.4
	github.com/micro/go-micro v1.1.0
	github.com/micro/go-plugins v1.1.0 // indirect
	golang.org/x/net v0.0.0-20190419010253-1f3472d942ba
)

replace github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello => ./proto/hello/

replace github.com/bkono/micro-cdk-sample/vip-srv/proto/vip => ../vip-srv/proto/vip/

replace github.com/golang/lint => github.com/golang/lint v0.0.0-20190227174305-8f45f776aaf1

replace github.com/testcontainers/testcontainer-go => github.com/testcontainers/testcontainers-go v0.0.2
