export const paramValidator = (config: CPW.CellParam) => {
  const { value, type, options, required } = config
  // 确保opt值合法
  if (type === 'opt' && value) return !!options?.some(opt => opt.value === value)
  if (!required) return true

  if (type === 'str' || type === 'opt') return !!value
  if (type === 'num') return typeof value === 'number'
  return true
}
