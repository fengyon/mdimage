/**
 * 获取字符串长度，中文2个字符；其他1个字符
 * @param str 字符串
 * @returns 字符串长度
 */
export const getStrLength = (str: string): number =>
  str.split('').reduce((sum, code) => {
    const charCode = code.charCodeAt(0)
    const isEN = charCode >= 0 && charCode <= 128
    return sum + (isEN ? 1 : 2)
  }, 0)
