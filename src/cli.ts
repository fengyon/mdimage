import PACK from '../package.json'
import { Command, Option } from 'commander'
import chalk from 'chalk'
import { isHttpPath } from './shared/path-judge'
import { downloadHttpMd } from './parse/get-md-http'
import ora from 'ora'
import { wirteLocaleMd } from './parse/parse-md'

interface InputArgs {
  to: string
  from: string
  location: 'base64' | 'http' | 'local'
}
const wrapLoading = <T extends (...args: any[]) => any>(fn: T): T => {
  return function wrapedLoading(...args) {
    const loadingInstance = ora({
      text: '加载中',
    })
    loadingInstance.start()
    const value = fn.apply(this, args)
    Promise.resolve(value).then(
      () => loadingInstance.succeed('操作成功'),
      (error) => loadingInstance.fail(`操作失败：${String(error)}`)
    )
    return value
  } as T
}
const program = new Command()
program
  .command('parse [options]')
  .description('转换md文件中的图片格式')
  .requiredOption('-f, --from <path>', '需要转换的md文件源目录')
  .requiredOption('-t, --to <path>', '转换后的md文件存放目录')
  .addOption(
    new Option('-l, --location <type>', '转换后的图片存放位置，有 base64-md文件中, http-网络, local-本地目录')
      .choices(['base64']) /* , 'http', 'local' */
      .default('base64', ' base64格式置于md文件中')
  )
  .action(async (name, args: InputArgs) => {
    const { to, from, location } = args
    console.log(name, args)
    if (isHttpPath(from)) {
      await wrapLoading(downloadHttpMd)(from, to)
    } else {
      wrapLoading(wirteLocaleMd)(from, to)
    }
  })
// .addOption(new Option('-s, --secret').hideHelp())
// .addOption(new Option('-t, --timeout <delay>', 'timeout in seconds').default(60, 'one minute'))
// .addOption(new Option('-d, --drink <size>', 'drink size').choices(['small', 'medium', 'large']))
// .addOption(new Option('-p, --port <number>', 'port number').env('PORT'))
// .addOption(new Option('--donate [amount]', 'optional donation in dollars').preset('20').argParser(parseFloat))
// .addOption(new Option('--disable-server', 'disables the server').conflicts('port'))
// .addOption(new Option('--free-drink', 'small drink included free ').implies({ drink: 'small' }))
program
  .name(PACK.name)
  .description(`CLI to ${PACK.name}. ${PACK.description}`)
  .version(`${PACK.name}@${PACK.version}`)
  .usage('<command> [option]')

program.on('-h, --help', () => {
  console.log()
  console.log(`运行 ${chalk.cyan('mdimage <command> --help')} 查看更多信息`)
  console.log()
})
program.parse(process.argv)
