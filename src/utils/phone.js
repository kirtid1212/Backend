const normalizePhone = (phone) => {
  const value = String(phone || '').trim();
  if (!value) return '';
  if (value.startsWith('+')) return value;
  if (/^\d{10}$/.test(value)) return `+91${value}`;
  return `+${value}`;
};

const isValidPhone = (phone) => /^\+\d{10,15}$/.test(phone);

module.exports = { normalizePhone, isValidPhone };
