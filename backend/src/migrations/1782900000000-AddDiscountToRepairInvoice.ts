import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDiscountToRepairInvoice1782900000000
  implements MigrationInterface
{
  name = 'AddDiscountToRepairInvoice1782900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repair_invoice" ADD "discount" numeric(12,2) NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "repair_invoice" DROP COLUMN "discount"`,
    );
  }
}
