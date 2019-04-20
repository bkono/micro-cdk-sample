package handler

import (
	"log"
	"math/rand"

	pb "github.com/bkono/micro-cdk-sample/vip-srv/proto/vip"
	"golang.org/x/net/context"
)

type vipHandler struct{}

func (v *vipHandler) CheckName(ctx context.Context, req *pb.CheckNameRequest, rsp *pb.CheckNameResponse) error {
	log.Print("Received VIP.CheckName request")

	rsp.IsVip = rand.Intn(10) > 5
	log.Println("is vip check", rsp.IsVip)

	return nil
}

func NewVIPHandler() pb.VIPHandler {
	return &vipHandler{}
}
