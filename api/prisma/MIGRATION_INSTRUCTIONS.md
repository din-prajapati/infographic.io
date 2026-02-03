# Migration Instructions for Conversations and Extractions

## Issue Resolution

The "Maximum call stack size exceeded" error was caused by running Prisma commands from the `api` directory. 

**Solution:** Run Prisma commands from the **root directory** of the project with the `--schema` flag.

## Running the Migration

**For Neon Serverless Databases:** Use `db push` instead of `migrate dev` (Neon serverless works better with `db push`):

```bash
# From project root (D:\Dinesh\DCloud\GITDrive\Work\Products\InfographicEditor-Unified)
npx prisma db push --schema=api/prisma/schema.prisma
```

**Note:** `db push` syncs your schema directly to the database without creating migration files. This is recommended for Neon serverless databases.

## Alternative: Using migrate dev (for traditional PostgreSQL)

If you're using a traditional PostgreSQL database (not Neon serverless), you can use migrations:

```bash
# From project root
npx prisma migrate dev --name add_conversations_and_extractions --schema=api/prisma/schema.prisma
```

**Note:** `migrate dev` requires direct TCP connections which may not work well with Neon serverless. Use `db push` for Neon.

## After Migration

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate --schema=api/prisma/schema.prisma
   ```

2. **Verify the migration:**
   - Check that `api/prisma/migrations/` contains the migration files
   - Verify that Prisma Client includes the new models (Conversation, Message, Extraction)

## Troubleshooting

### Database Connection Error
If you see `P1001: Can't reach database server`, ensure:
- Your `.env` file has the correct `DATABASE_URL`
- The database server is running and accessible
- Network/firewall allows connections to the database

### Stack Overflow Error
If you still see stack overflow errors:
- Make sure you're running from the **root directory**, not the `api` directory
- Use the `--schema=api/prisma/schema.prisma` flag
- Clear Prisma cache: `Remove-Item -Recurse -Force node_modules\.prisma`

## Models Added

The migration adds three new models:
1. **Conversation** - Stores conversation metadata
2. **Message** - Stores individual messages in conversations
3. **Extraction** - Stores property data extractions

All models are properly linked to the User model and include appropriate indexes.
