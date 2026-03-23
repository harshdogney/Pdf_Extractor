import dotenv from "dotenv";
import Redis from "ioredis";
dotenv.config();

// BullMQ expects a Redis protocol client (ioredis), not Upstash's REST client.
//
function toUpstashRedisProtocolUrl() {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!restUrl || !token) return null;

  // Example restUrl: https://perfect-robin-81985.upstash.io
  let hostname;
  try {
    hostname = new URL(restUrl).hostname;
  } catch {
    // Fallback: strip protocol-ish prefixes
    hostname = restUrl.replace(/^https?:\/\//, "").split("/")[0];
  }

  if (!hostname) return null;
  // Upstash's Redis endpoint is TLS by default.
  return `rediss://default:${token}@${hostname}:6379`;
}

const raw = process.env.REDIS_URL || "";
const extractedUrl = raw.match(/(rediss?:\/\/\S+)/)?.[1] || raw;
const useTls = raw.includes("--tls") || extractedUrl.startsWith("rediss://");
const derivedUrl = toUpstashRedisProtocolUrl();

const redis = new Redis(extractedUrl || derivedUrl || undefined, {
  // BullMQ workers require blocking commands with no per-request retry cap.
  maxRetriesPerRequest: null,
  ...(useTls ? { tls: { rejectUnauthorized: false } } : null),
  // Avoid failing readiness checks on some managed Redis setups.
  enableReadyCheck: false,
});

export default redis;
