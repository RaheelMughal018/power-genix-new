import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAsset1778166578339 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "asset" (
                "id" SERIAL PRIMARY KEY,
                "name" varchar(255) NOT NULL,
                "type" varchar(100) NOT NULL,
                "amount" decimal(12,2) NOT NULL,
                "purchaseDate" date NOT NULL,
                "accountId" integer NOT NULL,
                "notes" text,
                "createdById" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                CONSTRAINT "FK_asset_account" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION,
                CONSTRAINT "FK_asset_user" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "asset"`);
    }

}
