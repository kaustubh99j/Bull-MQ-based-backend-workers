# BullMQ Video Queue with NestJS

A scalable background job processing system built with **NestJS**, **BullMQ**, and **Redis**.

## Tech Stack

- NestJS
- BullMQ
- Redis
- Docker
- TypeScript

## Architecture

The application uses a producer-consumer architecture:

```text
Client
  │
  │ POST /video/process
  ▼
VideoController
  │
  │ Add job
  ▼
BullMQ
  │
  ▼
Redis
  │
  │ Consume job
  ▼
VideoProcessor
  │
  ├── Success → Completed
  │
  └── Error → Failed → Retry
