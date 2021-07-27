export const typeOf = (value): string => {
  if (Array.isArray(value)) return 'array'
  return typeof value
}
