module github.com/bkono/micro-cdk-sample/vip-srv

require (
	github.com/bkono/micro-cdk-sample/vip-srv/proto/vip v0.0.0-00010101000000-000000000000
	github.com/micro/go-log v0.1.0
	github.com/micro/go-micro v1.1.0
	golang.org/x/net v0.0.0-20190327214358-63eda1eb0650
)

replace github.com/bkono/micro-cdk-sample/vip-srv/proto/vip => ./proto/vip/
