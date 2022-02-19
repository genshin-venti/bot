import { Context, Logger, Next, Session } from 'koishi'

interface Config {}

export default class TestPlugin {
  name = 'TestPlugin'
  logger: Logger

  constructor(private ctx: Context, private config: Config) {
    this.logger = ctx.logger(this.name)
    ctx.middleware(this.callback.bind(this))
  }

  callback(session: Session, next: Next) {
    if (process.env.NODE_ENV === 'development') {
      this.logger.info('msg', session.content)
      this.logger.info('ids', session.userId, session.username, session.guildId)
      this.logger.info('user', session.user) // 对应 "user" model
    }
    return next()
  }
}
