-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "executivo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT
);
INSERT INTO "new_Role" ("createdAt", "deletedAt", "deletedById", "deletedByName", "descricao", "id", "nome", "sistema", "slug", "updatedAt") SELECT "createdAt", "deletedAt", "deletedById", "deletedByName", "descricao", "id", "nome", "sistema", "slug", "updatedAt" FROM "Role";
DROP TABLE "Role";
ALTER TABLE "new_Role" RENAME TO "Role";
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

