CREATE TABLE "UserLoginAlias" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLoginAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserLoginAlias_email_key" ON "UserLoginAlias"("email");
CREATE INDEX "UserLoginAlias_userId_idx" ON "UserLoginAlias"("userId");

ALTER TABLE "UserLoginAlias" ADD CONSTRAINT "UserLoginAlias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "UserLoginAlias" ("id", "email", "userId", "createdAt", "updatedAt")
SELECT 'alias_alex_old_gmail', 'amariexc@gmail.com', "id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "User"
WHERE "email" = 'alex@ghostai.solutions'
ON CONFLICT ("email") DO NOTHING;
