export const once = (func: (...[]) => any) => {
  let isCalled = false
  return (...args: any[]) => {
    isCalled = true
    return func(...args)
  }
}
