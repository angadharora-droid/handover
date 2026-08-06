// Phone numbers are compared by their last 10 digits so formatting and an
// optional country code don't matter: "+91 98765 43210" matches "9876543210".
export function phoneKey(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(-10);
}
