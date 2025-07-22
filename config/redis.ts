import Env from '@ioc:Adonis/Core/Env'

const redisConfig = {
  connection: 'local',
  connections: {
    local: {
      host: Env.get('BULL_REDIS_HOST', '127.0.0.1'),
      port: Env.get('BULL_REDIS_PORT', 6379),
      password: Env.get('BULL_REDIS_PASSWORD', ''),
      db: 0,
      keyPrefix: '',
    },
  },
}

export default redisConfig
