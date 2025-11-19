-- CreateTable
CREATE TABLE "BookCache" (
    "bookId" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "publishedDate" TEXT,
    "pageCount" INTEGER,
    "categories" TEXT,
    "thumbnailUrl" TEXT,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadBooks" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "calificacion" INTEGER,
    "reseña" TEXT,
    "fechaFinal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadBooks_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReadBooks_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookCache" ("bookId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReadBooks" ("bookId", "calificacion", "fechaFinal", "id", "reseña", "usuarioId") SELECT "bookId", "calificacion", "fechaFinal", "id", "reseña", "usuarioId" FROM "ReadBooks";
DROP TABLE "ReadBooks";
ALTER TABLE "new_ReadBooks" RENAME TO "ReadBooks";
CREATE INDEX "ReadBooks_usuarioId_idx" ON "ReadBooks"("usuarioId");
CREATE UNIQUE INDEX "ReadBooks_usuarioId_bookId_key" ON "ReadBooks"("usuarioId", "bookId");
CREATE TABLE "new_ReadingList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuarioId" INTEGER NOT NULL,
    "bookId" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingList_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReadingList_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "BookCache" ("bookId") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ReadingList" ("bookId", "creadoEn", "id", "notas", "prioridad", "usuarioId") SELECT "bookId", "creadoEn", "id", "notas", "prioridad", "usuarioId" FROM "ReadingList";
DROP TABLE "ReadingList";
ALTER TABLE "new_ReadingList" RENAME TO "ReadingList";
CREATE INDEX "ReadingList_usuarioId_idx" ON "ReadingList"("usuarioId");
CREATE UNIQUE INDEX "ReadingList_usuarioId_bookId_key" ON "ReadingList"("usuarioId", "bookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "BookCache_bookId_key" ON "BookCache"("bookId");
