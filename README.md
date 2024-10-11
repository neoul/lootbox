# VRF Lootbox

```bash
# set -a
# source .env.development
# set +a
# pnpm migration:create lootbox_rolls
# pnpm migration:run

docker compose up --build

#  or
docker compose up db -d
pnpm install
pnpm build
pnpm start:dev -s .key/abcd --new_key
```

```bash
curl -X POST http://localhost:8282/lootbox/roll \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
       "roll_id": 1,
       "roll_count": 2
     }'

curl -X GET http://localhost:8282/lootbox/roll/5
curl -X GET http://localhost:8282/lootbox/rolls?roll_id=100 | jq

```

## Generate P-256 Crypto key


```bash
openssl ecparam -name prime256v1 -genkey -noout -out private_key.pem
openssl ec -in private_key.pem -pubout -out public_key.pem
openssl ec -in private_key.pem -text -noout
openssl ec -in private_key.pem -text -noout | grep priv -A 3 | tail -n +2 | tr -d '\n[:space:]:' | sed 's/^00//' > private_key
```

> [Info] NIST P-256 = secp256r1 = prime256v1 (OpenSSL)

