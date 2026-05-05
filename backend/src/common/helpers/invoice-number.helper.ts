import { Repository } from 'typeorm';

export async function generateInvoiceNumber(
  prefix: string,
  repository: Repository<any>,
  columnName: string = 'invoiceNumber',
): Promise<string> {
  const last = await repository
    .createQueryBuilder('entity')
    .withDeleted()
    .where(`entity.${columnName} LIKE :prefix`, { prefix: `${prefix}-%` })
    .orderBy('entity.id', 'DESC')
    .getOne();

  if (!last) {
    return `${prefix}-0001`;
  }

  const parts = (last[columnName] as string).split('-');
  const lastNum = parseInt(parts[parts.length - 1], 10);
  const next = isNaN(lastNum) ? 1 : lastNum + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}
