import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number into Pakistani Rupee representation
 * Example: 1500 -> "Rs. 1,500"
 */
export function formatPKR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }

  const formattedNumber = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  return `Rs. ${formattedNumber}`;
}

/**
 * Generate unique random ID
 */
export function generateId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * Generate a clean retail barcode (Code 128 compliant numeric/alphanumeric)
 */
export function generateSKU(categoryPrefix: string = '896'): string {
  // 896 is commonly used for Pakistan EAN-13 GS1 country code
  const randomPart = Math.floor(100000000 + Math.random() * 900000000);
  return `${categoryPrefix}${randomPart}`.substring(0, 12);
}

/**
 * Generate sequential formatted invoice number
 */
export function generateInvoiceNo(saleCount: number = 0): string {
  const date = new Date();
  const yearShort = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const seq = (saleCount + 1).toString().padStart(4, '0');
  return `INV-${yearShort}${month}-${seq}`;
}

/**
 * Format ISO date string into readable local format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into time
 */
export function formatTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

/**
 * Format ISO date string into Date + Time
 */
export function formatDateTime(dateString: string): string {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

/**
 * Calculate Cart Totals
 */
export function calculateCartTotals(
  items: CartItem[],
  overallDiscountPKR: number = 0,
  taxRatePercent: number = 0,
  enableTax: boolean = false
) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalCost = items.reduce((sum, item) => sum + (item.product.costPrice * item.quantity), 0);
  
  const discountTotal = Math.min(overallDiscountPKR, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  
  const taxAmount = enableTax && taxRatePercent > 0 
    ? Math.round((taxableAmount * taxRatePercent) / 100)
    : 0;

  const grandTotal = Math.max(0, taxableAmount + taxAmount);
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    totalCost,
    discountTotal,
    taxableAmount,
    taxAmount,
    grandTotal,
    totalItemsCount,
  };
}

/**
 * Clean Pakistani phone number to international WhatsApp format (923XXXXXXXXX)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('0')) {
    digits = '92' + digits.substring(1);
  } else if (digits.startsWith('3')) {
    digits = '92' + digits;
  }
  
  return digits;
}

/**
 * Generate a friendly WhatsApp Udhaar Payment reminder link
 */
export function generateWhatsAppReminderLink(
  customerName: string,
  phone: string,
  outstandingBalance: number,
  storeName: string,
  storePhone: string
): string {
  const formattedPhone = formatPhoneForWhatsApp(phone);
  
  const message = `Assalam-o-Alaikum ${customerName} Sahab,\n\nYeh ${storeName} ki janib se aik reminder hai ke aapka baaqi Khata / Udhaar balance *${formatPKR(outstandingBalance)}* hai.\n\nBaraye meharbani jald az jald payment ada farmayein ya rabta karein: ${storePhone}.\n\nShukriya!\n*${storeName}*`;
  
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}
