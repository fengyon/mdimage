import PACK from '../package.json'
import { Command, Option } from 'commander'
import chalk from 'chalk'
import { isHttpPath } from './shared/path-judge'
import { downloadHttpMd } from './parse/get-md-http'
import defaultOptions from '../assets/config.json'
import { dealValue, formatStrByArr, wrapLoading } from './shared/cli-utils'
import { ensureFile, existsSync, lstatSync, readFile, writeFile } from 'fs-extra'
import path from 'path'
import { wirteLocaleMd } from './shared/file-utils/markdown'

interface Options {
  to: string
  from: string
  location: 'base64' | 'http' | 'local'
  imgpos: string
}

const getValidOptions = (options: Options): Options =>
  Object.keys(defaultOptions).reduce(
    (memo, key) => {
      if (options[key]) {
        memo[key] = options[key]
      }
      return memo
    },
    { ...defaultOptions } as Options
  )
const fromOptionDes = '转换后的图片存放位置:base64-md文件中;http-网络;local-本地目录'

const program = new Command()
program
  .command('parse [others...]')
  .description('转换md文件中的图片格式')
  .addOption(new Option('-f, --from <path>', '需要转换的md文件源目录'))
  .addOption(new Option('-t, --to <path>', '转换后的md文件存放目录'))
  .addOption(
    new Option('-l, --location <type>', fromOptionDes)
      .choices(['base64', 'http', 'local'])
      .default('base64', ' base64格式置于md文件中')
  )
  .addOption(new Option('-i, --imgpos <position>', '转换后的图片存放的详细目录或者网络地址'))
  .action((others, options: Options) => {
    const { to, from, location, imgpos } = getValidOptions(options)

    switch (location) {
      case 'base64': {
        wrapLoading(isHttpPath(from) ? downloadHttpMd : wirteLocaleMd)(from, to)
        break
      }
      case 'http': {
        break
      }
      case 'local': {
        break
      }
      default:
    }
  })
const configFilePath = path.join(__dirname, './assets/config.json')

const wirteOptionsToFile = async (options: Options): Promise<void> => {
  await ensureFile(configFilePath)
  await writeFile(configFilePath, JSON.stringify({ ...defaultOptions, ...options }), 'utf8')
}

const readOptionsFromFile = async (): Promise<Options> => {
  let readedOptions = {}
  if (existsSync(configFilePath) && lstatSync(configFilePath).isFile()) {
    const result = await readFile(configFilePath, 'utf-8')
    readedOptions = JSON.parse(result)
  }
  return {
    ...defaultOptions,
    ...readedOptions,
  } as Options
}
// 配置设置
const configCommand = program.command('config')
configCommand
  .command('set [others...]')
  .description('获取转换的默认配置')
  .addOption(new Option('-f, --from <path>', '需要转换的md文件源目录'))
  .addOption(new Option('-t, --to <path>', '转换后的md文件存放目录'))
  .addOption(new Option('-l, --location <type>', fromOptionDes).choices(['base64', 'http', 'local']))
  .addOption(new Option('-i, --imgpos <position>', '转换后的图片存放的详细目录或者网络地址'))
  .action((others: string[], options: Options) => {
    if (Object.values(options).filter(Boolean).length === 0) {
      program.error(chalk.red('请输入设置的选项'))
    } else {
      wirteOptionsToFile(options).then(
        () => console.log(chalk.green('配置成功')),
        (error) => program.error(chalk.red(`配置失败: ${error}`))
      )
    }
  })
// 配置获取
configCommand
  .command('get [others...]')
  .description('设置转换的默认配置')
  .addOption(new Option('-f, --from', '需要转换的md文件源目录'))
  .addOption(new Option('-t, --to', '转换后的md文件存放目录'))
  .addOption(new Option('-l, --location', fromOptionDes))
  .addOption(new Option('-i, --imgpos', '转换后的图片存放的详细目录或者网络地址'))
  .action((others: string[], options: Options) => {
    readOptionsFromFile().then(
      (validOptions) => {
        const { to, from, location, imgpos } = validOptions
        const isEmptyOptions = Object.values(options).filter(Boolean).length === 0
        const hasKey = (key: keyof Options): boolean => isEmptyOptions || Boolean(options[key])
        console.log(
          formatStrByArr(
            [
              hasKey('from') && [chalk.cyan('from'), dealValue(from), '(需要转换的md文件源目录)'],
              hasKey('to') && [chalk.cyan('to'), dealValue(to), '(转换后的md文件存放目录)'],
              hasKey('location') && [chalk.cyan('location'), dealValue(location), `(${fromOptionDes})`],
              hasKey('imgpos') && [chalk.cyan('imgpos'), dealValue(imgpos), '(转换后的图片存放的详细目录或者网络地址)'],
            ].filter(Boolean) as string[][]
          )
        )
      },
      (error) => program.error(chalk.red(`获取配置失败: ${error}`))
    )
  })

program
  .name(PACK.name)
  .description(`CLI to ${PACK.name}. ${PACK.description}`)
  .version(`${PACK.name}@${PACK.version}`, '-v,  --version')
  .usage('<command> [option]')

program.on('-h, --help', () => {
  console.log()
  console.log(`运行 ${chalk.cyan('mdimage <command> --help')} 查看更多信息`)
  console.log()
})
program.showHelpAfterError(true)
program.parse(process.argv)
