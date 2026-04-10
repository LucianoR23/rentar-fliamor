import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null
    return Math.min(times * 500, 3000)
  },
})

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message)
})
