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
