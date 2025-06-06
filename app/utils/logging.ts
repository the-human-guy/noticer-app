export const $log = (...args: any[]) => {
  console.log(`[LOG]`, ...args)
}

export const $logerr = (...args: any[]) => {
  console.error(`[ERROR]`, ...args)
}
