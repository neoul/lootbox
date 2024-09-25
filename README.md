

```bash
set -a
source .env.development
set +a
# pnpm migration:create lootbox_rolls
pnpm migration:run
```

```bash
curl -X POST http://localhost:8282/lootbox/roll \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed",
       "roll_id": 1,
       "roll_count": 2
     }'
```