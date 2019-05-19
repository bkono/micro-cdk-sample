package main

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	hello "github.com/bkono/micro-cdk-sample/greeter-srv/proto/hello"
	vip "github.com/bkono/micro-cdk-sample/vip-srv/proto/vip"
	_ "github.com/bkono/micro-plugins/registry/cloudmap"
	"github.com/micro/go-micro"

	"golang.org/x/net/context"
)

var (
	regGreet = "Hello %s"
	vipGreet = "Well hello, %s. Thanks for being a VIP!"
)

type say struct {
	vipcl vip.VIPService
}

func (s *say) Hello(ctx context.Context, req *hello.Request, rsp *hello.Response) error {
	log.Print("Received Say.Hello request, checking vip")

	viprsp, err := s.vipcl.CheckName(ctx, &vip.CheckNameRequest{Name: req.Name})
	log.Println("vip.CheckName called", viprsp, err)

	if viprsp.IsVip {
		rsp.Msg = fmt.Sprintf(vipGreet, req.Name)
	} else {
		rsp.Msg = fmt.Sprintf(regGreet, req.Name)
	}

	return nil
}

func NewSayHandler(client vip.VIPService) hello.SayHandler {
	return &say{client}
}

func main() {
	service := micro.NewService(
		micro.Name("go.micro.srv.greeter"),
		micro.RegisterTTL(time.Second*30),
		micro.RegisterInterval(time.Second*10),
	)

	// optionally setup command line usage
	service.Init()

	// Setup clients

	cl := vip.NewVIPService("go.micro.srv.vip", service.Client())

	// Register Handlers
	hello.RegisterSayHandler(service.Server(), NewSayHandler(cl))

	go func() {
		for {
			viprsp, err := cl.CheckName(context.Background(), &vip.CheckNameRequest{Name: "goroutine-name"})
			log.Println("vip.CheckName called", viprsp, err)

			time.Sleep(time.Duration(rand.Intn(30)) * time.Second)
		}
	}()

	// Run server
	if err := service.Run(); err != nil {
		log.Fatal(err)
	}
}
