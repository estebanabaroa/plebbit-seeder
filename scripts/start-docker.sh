root_path=$(cd `dirname $0` && cd .. && pwd)
cd "$root_path"

docker rm -f ipfs 2>/dev/null

# start kubo daemon
docker run \
  --detach \
  --network=host \
  --volume=$(pwd):/usr/src/ipfs \
  --workdir=/usr/src/ipfs \
  --name plebbit-seeder \
  --restart always \
  --log-opt max-size=10m \
  --log-opt max-file=5 \
  node:18 sh -c "node start"

# wait for kubo daemon to start
docker logs --follow plebbit-seeder &
sleep 5
