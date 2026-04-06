source .env

docker stop $STRUCTURER_APP_NAME 2>/dev/null || true
docker rm $STRUCTURER_APP_NAME 2>/dev/null || true

docker run --name $STRUCTURER_APP_NAME \
  -p 8055 \
  --restart unless-stopped \
  -e VIRTUAL_HOST=$VIRTUAL_HOST  \
  -e LETSENCRYPT_HOST=$LETSENCRYPT_HOST \
  -e LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL \
  -v `pwd`/dist:/usr/share/nginx/html:ro \
  -v `pwd`/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro \
  -d nginx
