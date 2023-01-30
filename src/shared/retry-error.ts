export const delay = (time: number) => new Promise((res) => setTimeout(res, time))
export const retryInError = async (fn: () => Promise<unknown>, limit: number) => {
  const maxlimit = 20
  const retryDelay = 200
  if (limit <= 0) {
    throw Error('重试次数超了')
  } else if (limit >= maxlimit) {
    console.log(`不正常的重试次数(${limit})，超过${maxlimit}次！！！`)
  }
  try {
    const result = await fn()
    return result
  } catch (error) {
    console.error(error)
    await delay(retryDelay)
    return retryInError(fn, limit - 1)
  }
}
