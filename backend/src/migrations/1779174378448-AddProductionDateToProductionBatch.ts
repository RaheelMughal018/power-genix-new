import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductionDateToProductionBatch1779174378448
  implements MigrationInterface
{
  name = 'AddProductionDateToProductionBatch1779174378448';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_batch" ADD "productionDate" date`,
    );
    await queryRunner.query(
      `UPDATE "production_batch" SET "productionDate" = "created_at"::date WHERE "productionDate" IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_batch" ALTER COLUMN "productionDate" SET NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "production_batch" DROP COLUMN "productionDate"`,
    );
  }
}
