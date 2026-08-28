import express from "express";

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import { Queue } from "bullmq";
import { redis } from "./lib/redis";

const app = express();

const serverAdapter =
  new ExpressAdapter();

serverAdapter.setBasePath("/admin/queues");

const documentQueue = new Queue(
  "document-processing",
  {
    connection: redis,
  }
);

createBullBoard({
  queues: [
    new BullMQAdapter(
      documentQueue
    ),
  ],

  serverAdapter,
});

app.use(
  "/admin/queues",
  serverAdapter.getRouter()
);

app.listen(3001, () => {
  console.log(
    "Bull Board running at http://localhost:3001/admin/queues"
  );
});