FROM alpine:3.2
ENV REFRESHED_AT 2019-05-04T19:42:13+0000

RUN apk --no-cache add --update ca-certificates

WORKDIR /
COPY micro-linux micro
# COPY --from=build-env /go/bin/micro micro
ENTRYPOINT [ "/micro" ]
CMD ["--enable_stats", "api"]

