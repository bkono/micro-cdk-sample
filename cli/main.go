package main

import (
	"fmt"

	_ "github.com/bkono/micro-plugins/registry/cloudmap"
	"github.com/micro/go-micro/client"
	"github.com/micro/go-micro/cmd"
	"github.com/micro/go-micro/metadata"

	hello "github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello"

	"golang.org/x/net/context"
)

func main() {
	cmd.Init()

	// Use the generated client stub
	cl := hello.NewSayService("go.micro.srv.greeter", client.DefaultClient)

	// Set arbitrary headers in context
	ctx := metadata.NewContext(context.Background(), map[string]string{
		"X-User-Id": "john",
		"X-From-Id": "script",
	})

	// Make request
	rsp, err := cl.Hello(ctx, &hello.Request{
		Name: "John",
	})
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println(rsp.Msg)
}
