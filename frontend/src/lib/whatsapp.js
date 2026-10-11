/**
 * Shared WhatsApp helper utilities for Fouzas Creation.
 * Normalizes phone numbers and generates click-to-chat WhatsApp links.
 */

/**
 * Clean a phone or WhatsApp number by stripping spaces, dashes,
 * leading 0 or country code (+91 / 91). Returns a standard 10-digit number.
 *
 * @param {string} phone
 * @returns {string} 10-digit clean phone string
 */
export function cleanWhatsAppNumber(phone) {
  if (!phone) return '';
  // Strip all non-digit characters
  let digits = String(phone).replace(/\D/g, '');

  // Strip international +91 or 91 prefix if 12 digits
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  // Strip leading 0 if 11 digits
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }

  return digits;
}

/**
 * Formats a clean 10-digit phone number into an international wa.me click-to-chat URL.
 * Defaults to country code 91 (India).
 *
 * @param {string} phone - Customer or business phone number
 * @param {string} [message] - Optional prefilled chat message
 * @returns {string} wa.me link
 */
export function formatWhatsAppChatUrl(phone, message = '') {
  const clean = cleanWhatsAppNumber(phone);
  if (!clean || clean.length < 10) return '#';
  const international = `91${clean.slice(-10)}`;
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${international}${textParam}`;
}

/**
 * Gets the shop's WhatsApp number from the environment variable (VITE_WHATSAPP_NUMBER).
 *
 * @returns {string} 10-digit clean phone string
 */
export function getShopWhatsAppNumber() {
  const envNumber = import.meta.env?.VITE_WHATSAPP_NUMBER || '';
  return cleanWhatsAppNumber(envNumber);
}

/**
 * Generates a WhatsApp click-to-chat URL for contacting the Fouzas Creation shop.
 *
 * @param {string} [message] - Prefilled message
 * @returns {string} wa.me URL
 */
export function getShopWhatsAppUrl(message = 'Hello Fouzas Creation, I would like to enquire about bespoke gifts.') {
  const shopPhone = getShopWhatsAppNumber();
  if (!shopPhone) {
    // If no phone configured, return fallback
    return '#';
  }
  return formatWhatsAppChatUrl(shopPhone, message);
}

/**
 * Formats a concise, descriptive, properly URL-encoded WhatsApp message for orders.
 * Incorporates the order number, product title, or hamper item summary.
 *
 * @param {object} order - Order document or snapshot
 * @param {'confirm'|'status'} [action='confirm'] - Intent of the message
 * @returns {string} Short formatted message string
 */
export function buildOrderWhatsAppMessage(order, action = 'confirm') {
  if (!order) {
    return 'Hello Fouzas Creation! I would like to enquire about my bespoke gift order.';
  }

  const orderNumber = order.orderNumber || order.orderId || '';
  const isHamper = !!order.hamper?.items?.length;

  let productSummary = '';
  if (isHamper) {
    const baseName = order.hamper.base?.name || 'Custom Hamper';
    const totalItems = order.hamper.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
    productSummary = `${baseName} (${totalItems} items)`;
  } else {
    productSummary =
      order.itemSnapshot?.title ||
      order.item?.title ||
      order.itemTitle ||
      'Bespoke Creation';
  }

  if (action === 'status') {
    return `Hello Fouzas Creation! Regarding order #${orderNumber} (${productSummary}): could you please share a status update?`;
  }

  return `Hello Fouzas Creation! I just placed order #${orderNumber} (${productSummary}). Could you please confirm details?`;
}

/**
 * Generates a direct WhatsApp link for a specific order.
 *
 * @param {object} order
 * @param {'confirm'|'status'} [action='confirm']
 * @returns {string} wa.me link
 */
export function getOrderWhatsAppUrl(order, action = 'confirm') {
  const message = buildOrderWhatsAppMessage(order, action);
  return getShopWhatsAppUrl(message);
}

