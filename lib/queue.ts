import { Queue } from "bullmq";
import { redis } from "./redis";

export const documentQueue = new Queue("document-processing", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 2000,
    },

    removeOnComplete: {
      count: 100,
    },

    removeOnFail: {
      count: 100,
    },
  },
});