Docflow

A scalable asynchronous PDF document-processing system built with Next.js, PostgreSQL, Prisma, BullMQ, Redis, and PDFParse.

Docflow allows users to upload PDF documents, stores the original PDF directly in PostgreSQL, processes documents asynchronously using a BullMQ worker, extracts text from PDFs, and tracks processing status and progress.

Features
📄 PDF upload
🔒 File type validation
📦 Maximum file size validation
🗄️ Store PDF binary data directly in PostgreSQL
⚡ Asynchronous document processing with BullMQ
🔴 Redis-backed job queue
🔎 PDF text extraction with pdf-parse
📊 Document processing progress tracking
✅ Completed/failed document states
🔁 Worker concurrency support
📝 Store extracted text in PostgreSQL
🚫 No dependency on local PDF file paths
Architecture
                    Architecture
Upload PDF
Validate PDF
Store PDF bytes
Create documentId job
Fetch pdfData
PDF Buffer
Extracted Text
Update status & progress
Save extractedText
Browser
Next.js API
Convert to Buffer
(PostgreSQL)
BullMQ Queue
(Redis)
Document Worker
PDFParse
Document Data
Processing Flow
sequenceDiagram
    participant U as Browser
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Q as BullMQ
    participant R as Redis
    participant W as Worker
    participant P as PDFParse

    U->>API: Upload PDF
    API->>API: Validate file
    API->>DB: Store pdfData
    API->>Q: Add documentId job
    Q->>R: Store job

    API-->>U: 201 Created

    R->>W: Process job
    W->>DB: Fetch pdfData
    DB-->>W: PDF bytes

    W->>P: Parse PDF
    P-->>W: Extracted text

    W->>DB: Save extractedText
    W->>DB: status = COMPLETED
    W->>DB: progress = 100

Document Lifecycle
stateDiagram-v2
    [*] --> QUEUED

    QUEUED --> PROCESSING

    PROCESSING --> COMPLETED
    PROCESSING --> FAILED

    COMPLETED --> [*]
    FAILED --> [*]

System Components
Component	Responsibility
Browser	Upload PDF and display document status
Next.js API	Validate uploads, store PDFs, create jobs
PostgreSQL	Store PDFs, metadata, processing state, and extracted text
Prisma	Database access and migrations
BullMQ	Manage asynchronous document-processing jobs
Redis	Backend for BullMQ
Document Worker	Process queued documents
PDFParse	Extract text from PDF files
Data Flow
PDF Upload
    ↓
Next.js API
    ↓
Buffer
    ↓
PostgreSQL
    │
    └── pdfData
         │
         └── documentId
                ↓
             BullMQ
                ↓
              Redis
                ↓
         Document Worker
                ↓
            PDFParse
                ↓
         extractedText
                ↓
           PostgreSQL

Processing Flow
1. Upload

The client uploads a PDF to the Next.js API.

The API validates:

A file was uploaded.
The file is a PDF.
The file is smaller than 4 MB.

The uploaded file is converted into a Node.js Buffer.

const bytes = await file.arrayBuffer();
const pdfData = Buffer.from(bytes);

2. Store PDF

The PDF is stored directly in PostgreSQL using Prisma.

pdfData Bytes?


The application no longer depends on a local filePath.

3. Create Queue Job

After storing the document, the API creates a BullMQ job.

await documentQueue.add("process-document", {
  documentId: document.id,
});


Only the documentId is sent to the queue.

The PDF itself is not stored in Redis.

4. Worker Processing

The worker listens to the document-processing queue.

document-processing
        ↓
      Redis
        ↓
Document Worker


The worker retrieves the PDF from PostgreSQL using the document ID.

5. Extract Text

The worker passes the PDF buffer to PDFParse.

const parser = new PDFParse({
  data: Buffer.from(document.pdfData),
});

const pdfResult = await parser.getText();

const extractedText = pdfResult.text;

await parser.destroy();

6. Save Result

The extracted text is saved back to PostgreSQL.

pdfData
    +
extractedText
    +
status
    +
progress

Document Lifecycle

Documents move through the following states:

QUEUED
   │
   ▼
PROCESSING
   │
   ├──────────────► FAILED
   │
   ▼
COMPLETED

Progress

Processing progress is tracked at several stages:

10%   Processing started
30%   PDF loaded
80%   Text extracted
100%  Processing completed


Progress is tracked both in BullMQ and in the Document table.

Tech Stack
Technology	Purpose
Next.js	Web application and API
TypeScript	Type safety
PostgreSQL	Persistent document storage
Prisma	Database ORM
Redis	Queue backend
BullMQ	Background job processing
PDFParse	PDF text extraction
Node.js	Worker runtime
tsx	TypeScript worker execution
Project Structure
docflow/
│
├── app/
│   └── api/
│       └── documents/
│           └── route.ts
│
├── lib/
│   ├── prisma.ts
│   ├── queue.ts
│   └── redis.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── workers/
│   └── document-worker.ts
│
├── .env
├── package.json
├── prisma7.config.ts
└── README.md

Requirements

Before running Docflow, make sure you have:

Node.js
PostgreSQL
Redis
npm

Recommended Node.js version:

Node.js 22+

Environment Variables

Create a .env file in the project root.

DATABASE_URL="postgresql://postgres:password@localhost:5432/docflow"

REDIS_HOST="localhost"
REDIS_PORT="6379"


Adjust the values according to your local PostgreSQL and Redis configuration.

The worker explicitly loads environment variables using:

import "dotenv/config";


This is required because the worker runs independently from the Next.js process.

Installation

Clone the repository and install dependencies:

npm install

Database Setup

Make sure PostgreSQL is running.

Create the database:

docflow


Then run Prisma migrations:

npx prisma migrate dev


Generate Prisma Client:

npx prisma generate


Check migration status:

npx prisma migrate status

Running the Application

Start the Next.js application:

npm run dev


The application will normally be available at:

http://localhost:3000

Running the Worker

The document processor runs as a separate process.

npm run worker


Expected output:

Document processing worker started...


The worker is configured with:

concurrency: 3


This allows up to three documents to be processed concurrently.

API
Upload Document
POST /api/documents


Send a multipart/form-data request with:

file=<PDF>


Example response:

{
  "message": "Document uploaded successfully",
  "documentId": "document-id",
  "status": "QUEUED"
}

Get Documents
GET /api/documents


Returns the latest 20 documents.

Example:

{
  "documents": [
    {
      "id": "document-id",
      "filename": "example.pdf",
      "originalName": "example.pdf",
      "status": "COMPLETED",
      "progress": 100,
      "extractedText": "Extracted PDF text...",
      "errorMessage": null,
      "createdAt": "2026-08-28T10:00:00.000Z",
      "completedAt": "2026-08-28T10:00:05.000Z"
    }
  ]
}

Database Model

The Document entity stores both the original PDF and its processing results.

Conceptually:

Document
│
├── id
├── filename
├── originalName
├── pdfData
├── status
├── progress
├── attempts
├── extractedText
├── errorMessage
├── createdAt
└── completedAt

pdfData

Contains the original PDF as binary data.

PostgreSQL stores this as a binary field.

pdfData Bytes?

extractedText

Contains text extracted from the original PDF.

extractedText String?

Why BullMQ?

PDF processing can be CPU-intensive and shouldn't block the HTTP request.

Instead of doing this:

HTTP Request
     ↓
Upload PDF
     ↓
Extract PDF
     ↓
Save result
     ↓
HTTP Response


Docflow uses asynchronous processing:

HTTP Request
     ↓
Upload PDF
     ↓
Save PDF
     ↓
Create Job
     ↓
HTTP Response
     
             ↓
          BullMQ
             ↓
           Redis
             ↓
          Worker
             ↓
       Extract Text
             ↓
       Save Result


This allows the API to respond quickly while the worker handles document processing in the background.

Error Handling

If processing fails, the worker updates the document:

status = FAILED


and stores the error:

errorMessage


The worker then throws the error so BullMQ can handle the failed job.

Example:

PROCESSING
     ↓
   Error
     ↓
  FAILED

Storage Design

Docflow intentionally stores the PDF in PostgreSQL rather than relying on a local filesystem.

Previous approach
PDF
 ↓
Local filesystem
 ↓
filePath
 ↓
Worker
 ↓
Read file

Current approach
PDF
 ↓
Buffer
 ↓
PostgreSQL
 ↓
documentId
 ↓
Worker
 ↓
Fetch pdfData
 ↓
PDFParse


This removes the dependency on local file paths and makes the document data part of the application's persistent database.

Development Commands

Start the Next.js application:

npm run dev


Start the BullMQ worker:

npm run worker


Generate Prisma Client:

npx prisma generate


Create a migration:

npx prisma migrate dev --name <migration_name>


Check migration status:

npx prisma migrate status


Validate Prisma schema:

npx prisma validate


Reset the development database:

npx prisma migrate reset


Warning: prisma migrate reset deletes development database data.

Production Considerations

The current system is designed primarily for development and small-to-medium workloads.

For production deployments, consider:

Object storage such as S3-compatible storage for large PDFs.
PostgreSQL connection pooling.
Dedicated Redis infrastructure.
Multiple worker processes.
Worker retry policies.
Dead-letter/failure queues.
Authentication and authorization.
Virus/malware scanning for uploaded files.
Stronger file validation.
PDF page/count limits.
Monitoring and logging.
Rate limiting.
Database backups.
Job idempotency.
Graceful worker shutdown.

For very large documents or high upload volume, storing binary PDFs directly in PostgreSQL may become less desirable than using object storage and keeping only the storage key in PostgreSQL.

Future Improvements

Potential improvements include:

🔐 User authentication
👥 Multi-user document management
🔍 Full-text document search
📑 PDF page-level extraction
🤖 AI-powered document summarization
🏷️ Document tagging
📥 PDF download endpoint
👁️ PDF preview
📈 Processing analytics
🔁 Automatic retry handling
🧹 Automatic cleanup of failed jobs
☁️ S3-compatible object storage
📡 Real-time progress updates with WebSockets/SSE
🧪 Automated tests
📊 BullMQ monitoring

