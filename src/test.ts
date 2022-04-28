import { Context, Logger, Next, Session } from 'koishi'

interface Config {}

export default class TestPlugin {
  name = 'TestPlugin'
  private readonly logger: Logger

  constructor(private ctx: Context, private config: Config) {
    this.logger = ctx.logger(this.name)
    ctx.middleware(this.callback.bind(this))
  }

  async callback(session: Session, next: Next) {
    if (
      process.env.NODE_ENV !== 'development' &&
      process.env.NODE_ENV !== 'debug' &&
      (session.userId !== '956541711' || session.guildId !== '849791643')
    )
      return next()

    this.logger.info(JSON.stringify(session.content))

    return next()
  }
}
