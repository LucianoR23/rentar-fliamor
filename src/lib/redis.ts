import Redis from 'ioredis'

const url = process.env.REDIS_URL!
const useTls = url.startsWith('rediss://')

export const redis = new Redis(url, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) return null
    return Math.min(times * 500, 3000)
  },
  ...(useTls && { tls: { rejectUnauthorized: false } }),
})

redis.on('error', (err) => {
  console.error('[redis] connection error:', err.message)
})
