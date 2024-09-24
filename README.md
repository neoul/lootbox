

```bash
set -a
source .env.development
set +a
# pnpm migration:create lootbox_rolls
pnpm migration:run
```