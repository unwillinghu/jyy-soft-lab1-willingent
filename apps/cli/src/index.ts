import { APP_NAME, APP_VERSION } from '@pa/shared'

const baseUrl = process.env.PA_BASE_URL ?? 'http://127.0.0.1:4310'

async function main(): Promise<void> {
  const [, , command] = process.argv

  if (command === 'health') {
    const res = await fetch(`${baseUrl}/health`)
    console.log(await res.text())
    return
  }

  console.log(`${APP_NAME} v${APP_VERSION}`)
  console.log('usage: pa health    # 检查 core 服务状态')
}

await main()
