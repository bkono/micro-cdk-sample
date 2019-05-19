# build stage
FROM golang:1.12-alpine AS build-env
RUN mkdir -p /go/src \
  && mkdir -p /go/bin \
  && mkdir -p /go/pkg
RUN apk update && apk add git
ENV GO111MODULE on

WORKDIR /go/src/myapp
ADD . .
RUN go build -mod=vendor -v -o api .

# final stage
FROM alpine:3.2

RUN apk --no-cache add --update ca-certificates

WORKDIR /app
COPY --from=build-env /go/src/myapp/api api
ENTRYPOINT [ "/app/api" ]
