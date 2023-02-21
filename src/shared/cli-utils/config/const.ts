import path from 'path'

export enum CONFIG_FIELD {
  to = 'to', // 转换后md文件存放位置
  from = 'from', // md源文件位置
  imgto = 'imgto', // 图片存放位置：base64，md文件中；http://xxx：网络；其余本地目录

  // 目的是防止目录输错了
  maxFileCount = 'maxFileCount', // 转换md文件的最大数量
  maxDeep = 'maxDeep', // 读取md最大深度
  maxDirCount = 'maxDirCount', // 读取md涉及目录的最大数量
}

export enum CONFIG_FIELD_SIMPLE {
  to = 't', // 转换后md文件存放位置
  from = 'f', // md源文件位置
  imgto = 'i', // 图片存放位置：base64，md文件中；http://xxx：网络；其余本地目录

  // 目的是防止目录输错了
  maxFileCount = 'mfc', // 转换md文件的最大数量
  maxDeep = 'md', // 读取md最大深度
  maxDirCount = 'mdc', // 读取md涉及目录的最大数量
}
// 字段描述
export enum FIELD_DESCRIPTION {
  to = '需要转换的md文件源目录', // 转换后md文件存放位置
  from = '转换后的md文件存放目录', // md源文件位置
  imgto = '转换后的图片存放位置:base64-md文件中;http-网络;其他-本地目录', // 图片存放位置：base64，md文件中；http://xxx：网络；其余本地目录

  // 目的是防止目录输错了
  maxFileCount = '读取md文件的最大数量', // 转换md文件的最大数量
  maxDeep = '读取文件的最大深度', // 读取md最大深度
  maxDirCount = '读取目录的最大数量', // 读取md涉及目录的最大数量
}

export interface ConfigOptions {
  maxFileCount: number
  maxDeep: number
  maxDirCount: number
  to: string
  from: string
  imgto: string
}

export const cliFields = [
  CONFIG_FIELD.to,
  CONFIG_FIELD.from,
  CONFIG_FIELD.imgto,
  CONFIG_FIELD.maxDeep,
  CONFIG_FIELD.maxDirCount,
  CONFIG_FIELD.maxFileCount,
]

export const defaultOptions = {
  from: './',
  to: 'parsed',
  imgto: 'base64',
  maxDirCount: 100,
  maxDeep: 10,
  maxFileCount: 100,
} as const

export const configFilePath = path.join(__dirname, './assets/config.json')
