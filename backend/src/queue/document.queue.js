import { Queue } from "bullmq";
import redis from "../config/redis.js";

// Shared queue — used by the API to enqueue jobs
const documentQueue = new Queue("document-processing", { connection: redis });

export default documentQueue;
