#!/bin/bash
curl -X POST \
  http://192.168.4.1/rpc/update \
  -H 'cache-control: no-cache' \
  -H 'postman-token: 6f54ee23-8f55-9bd7-96b7-1a9aedfdac1b' \
  -d '{
	"url":"http://192.168.4.2:8080/worker.js"

}'
 
