import SQLiteDatabase from '@koishijs/plugin-database-sqlite'
import { Statement, SqliteError } from 'better-sqlite3'
import { Context, Logger, Next, segment, Session } from 'koishi'
import outdent from 'outdent'

declare module 'koishi' {
  interface Tables {
    drift_bottle: DriftBottle
  }

  interface Database {
    sqlite: SQLiteDatabase
  }
}

interface DriftBottle {
  id: number
  userId: string
  guildId: string
  content: string
  isPublic: number
  createdAt: Date
  bannedAt: Date
}

interface Config {
  throwBottleKey?: string
  fishBottleKey?: string
  prefix?: string
}

export default class DriftBottlePlugin {
  readonly name = 'drift-bottle'
  readonly #tableName = 'drift_bottle'
  readonly #logger: Logger
  #throwBottleKey = '丢个瓶子'
  #fishBottleKey = '捞瓶子'
  #prefix = ''
  readonly #db = () => this.ctx.database.sqlite.db
  readonly #regs = () => {
    return {
      fish: new RegExp(`^((?:${this.#prefix})${this.#fishBottleKey})\\s*$`),
      // image: /\[CQ:image,file=([a-z0-9]+\.image),url=(https?:\/\/.*),subType=(?:[0-9])\]/,
      // _image: /\[CQ:image,.*\]/,
      // _quote: /\[CQ:quote,.*\]/,
      quotedBottle: new RegExp(
        `^\\[CQ:quote,id=(-?[0-9]+)\\]\\[CQ:at,id=([0-9]+)\\]\\s*((?:${
          this.#prefix
        })${this.#throwBottleKey})\\s*$`
      ),
      normalBottle: new RegExp(
        `^(?:${this.#prefix})${this.#throwBottleKey}\\s*((?:.|\\n)*)$`
      ),
    }
  }
  readonly #templates = {
    ok: '好啦',
    noBottle: '还没有瓶子可捞哦',
    notInGroup: '请在群组内使用该功能',
    messageNotFound:
      '瓶子似乎被可莉炸飞了...请把瓶子内容重新发一遍再尝试扔瓶子哦',
    allowEitherTextOrImage: '只能往瓶子里丢文字和图片，且不能有@好友哦',
    duplicateContent: '已经有一样的瓶子了~',
  }

  constructor(
    private ctx: Context,
    private config: Config = {
      throwBottleKey: '扔个瓶子',
      fishBottleKey: '捞瓶子',
      prefix: '',
    }
  ) {
    this.#logger = ctx.logger(this.name)

    config.throwBottleKey && (this.#throwBottleKey = config.throwBottleKey)
    config.fishBottleKey && (this.#fishBottleKey = config.fishBottleKey)
    config.prefix && (this.#prefix = config.prefix)

    ctx.model.extend(
      this.#tableName,
      {
        id: 'unsigned',
        userId: 'string',
        guildId: 'string',
        content: 'string',
        isPublic: {
          type: 'unsigned',
          initial: 1,
        },
        createdAt: {
          type: 'timestamp',
        },
        bannedAt: {
          type: 'timestamp',
          initial: new Date(0),
        },
      },
      {
        autoInc: true,
        unique: [['content', 'guildId', 'isPublic']],
      }
    )

    ctx.middleware(this.callback.bind(this))
  }

  async callback(session: Session, next: Next) {
    if (!session.guildId) return this.#templates.notInGroup

    const message = session.content!
    const { fish, normalBottle, quotedBottle } = this.#regs()

    const parsedMsg = segment.parse(message)

    try {
      if (fish.test(message)) {
        // 捞个瓶子
        const bottle = await this.getOneRandomly(session.guildId)
        if (!bottle) return this.#templates.noBottle
        await session.sendQueued(
          // segment('quote', { id: session.messageId }) +
          bottle.content
        )
      } else if (normalBottle.test(message)) {
        // 普通消息瓶子
        const content = normalBottle.exec(message)![1]

        await this.#messageTypeGuard(session, content)

        await this.save(content, session.userId!, session.guildId)
        await session.sendQueued(
          segment('quote', { id: session.messageId! }) + this.#templates.ok
        )
      } else if (parsedMsg[0].type === 'quote' && quotedBottle.test(message)) {
        // 引用瓶子
        const quotedMsg = await this.#getMessage(session, parsedMsg[0].data.id)

        await this.#messageTypeGuard(session, quotedMsg.content!)

        await this.save(quotedMsg.content!, session.userId!, session.guildId)
        await session.sendQueued(
          segment('quote', { id: session.messageId! }) + this.#templates.ok
        )
      }
    } catch (error) {
      if (
        error instanceof SqliteError &&
        error.code === 'SQLITE_CONSTRAINT_UNIQUE'
      ) {
        // code: SQLITE_CONSTRAINT_UNIQUE
        await session.sendQueued(
          segment('quote', { id: session.messageId! }) +
            // this.#templates.ok
            this.#templates.duplicateContent
        )
        this.#logger.warn(error)
      } else {
        this.#logger.error(error)
      }
    }
    return next()
  }

  async #getMessage(session: Session, messageId: string) {
    try {
      const msg = await session.bot.getMessage(session.guildId!, messageId)
      return msg
    } catch (error) {
      session.sendQueued(
        segment('quote', { id: session.messageId! }) +
          this.#templates.messageNotFound
      )
      throw error
    }
  }

  async #messageTypeGuard(session: Session, message: string) {
    segment.parse(message).forEach(async (msg) => {
      if (msg.type !== 'text' && msg.type !== 'image') {
        await session.sendQueued(
          segment('quote', { id: session.messageId! }) +
            this.#templates.allowEitherTextOrImage
        )
        throw new Error(`Message type ${msg.type} is not allowed!`)
      }
    })
  }

  save(content: string, userId: string, guildId: string) {
    return this.ctx.database.create(this.#tableName, {
      content,
      userId,
      guildId,
      createdAt: new Date(),
    })
  }

  async getOneRandomly(guildId: string): Promise<DriftBottle> {
    return this.#exec(
      'get',
      outdent`
      SELECT * FROM ${this.#tableName} AS t1  JOIN (
        SELECT ROUND(
          ${Math.random()} * ((SELECT MAX(id) FROM ${
        this.#tableName
      })-(SELECT MIN(id) FROM ${this.#tableName}))
          +(SELECT MIN(id) FROM ${this.#tableName})
        ) AS id
      ) AS t2 WHERE (
        t1.id >= t2.id
        AND t1.bannedAt = 0
        AND (t1.isPublic = 1 OR (t1.isPublic = 0 AND guildId = ?))
      )
      ORDER BY t1.id LIMIT 1
      `,
      [guildId]
    )
  }

  // https://github.com/JoshuaWise/better-sqlite3/blob/HEAD/docs/api.md#class-statement
  #exec<K extends 'get' | 'run' | 'all'>(
    action: K,
    sql: string,
    params: any = []
  ) {
    try {
      const result = this.#db().prepare(sql)[action](params) as ReturnType<
        Statement[K]
      >
      this.#logger.debug('SQL > %c', sql)
      return result
    } catch (e) {
      this.#logger.warn('SQL > %c', sql)
      throw e
    }
  }
}
