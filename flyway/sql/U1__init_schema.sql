-- U1 — Undo schéma initial Trackshield
-- À jouer pour revenir à un état vide (ex: rollback de branche)
-- ATTENTION : supprime toutes les données

-- DropForeignKey (ordre inverse des dépendances)
ALTER TABLE "PiiDetection" DROP CONSTRAINT "PiiDetection_sessionId_fkey";
ALTER TABLE "Tracker" DROP CONSTRAINT "Tracker_sessionId_fkey";
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "User_email_key";

-- DropTable (ordre inverse des dépendances)
DROP TABLE IF EXISTS "PiiDetection";
DROP TABLE IF EXISTS "Tracker";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "User";
