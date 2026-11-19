
-- AlterTable
ALTER TABLE "OauthClient" DROP COLUMN "scopes",
ADD COLUMN     "scopes" JSONB,
DROP COLUMN "clientCredentialsScopes",
ADD COLUMN     "clientCredentialsScopes" JSONB,
DROP COLUMN "contacts",
ADD COLUMN     "contacts" JSONB,
DROP COLUMN "postLogoutRedirectUris",
ADD COLUMN     "postLogoutRedirectUris" JSONB,
DROP COLUMN "grantTypes",
ADD COLUMN     "grantTypes" JSONB,
DROP COLUMN "responseTypes",
ADD COLUMN     "responseTypes" JSONB;

-- AlterTable
ALTER TABLE "OauthResource" DROP COLUMN "allowedScopes",
ADD COLUMN     "allowedScopes" JSONB;

-- AlterTable
ALTER TABLE "OauthRefreshToken" DROP COLUMN "resources",
ADD COLUMN     "resources" JSONB,
DROP COLUMN "requestedUserInfoClaims",
ADD COLUMN     "requestedUserInfoClaims" JSONB;

-- AlterTable
ALTER TABLE "OauthAccessToken" DROP COLUMN "resources",
ADD COLUMN     "resources" JSONB,
DROP COLUMN "requestedUserInfoClaims",
ADD COLUMN     "requestedUserInfoClaims" JSONB;

-- AlterTable
ALTER TABLE "OauthConsent" DROP COLUMN "resources",
ADD COLUMN     "resources" JSONB,
DROP COLUMN "requestedUserInfoClaims",
ADD COLUMN     "requestedUserInfoClaims" JSONB;

