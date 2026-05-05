/**
 * Format a number to Pakistani Rupee format (1,00,000)
 * Pakistani numbering: last 3 digits, then groups of 2
 */
export function formatPKR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return 'Rs. 0';

  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'Rs. 0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const [intPart, decPart] = absNum.toFixed(2).split('.');

  // Pakistani grouping: last 3 digits, then groups of 2
  let formatted = '';
  if (intPart.length <= 3) {
    formatted = intPart;
  } else {
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = groups + ',' + lastThree;
  }

  const result = `Rs. ${formatted}.${decPart}`;
  return isNegative ? `- ${result}` : result;
}

/**
 * Format number with Pakistani grouping only (no Rs. prefix, no decimals)
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '0';

  const value = typeof num === 'string' ? parseInt(num, 10) : Math.floor(num);
  if (isNaN(value)) return '0';

  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const str = absValue.toString();

  let formatted = '';
  if (str.length <= 3) {
    formatted = str;
  } else {
    const lastThree = str.slice(-3);
    const remaining = str.slice(0, -3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formatted = groups + ',' + lastThree;
  }

  return isNegative ? `-${formatted}` : formatted;
}
