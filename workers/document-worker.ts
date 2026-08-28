import "dotenv/config";
import { Worker, Job } from "bullmq";
import { PDFParse } from "pdf-parse";

import { redis } from "../lib/redis";
import { prisma } from "../lib/prisma";

interface DocumentJob {
    documentId: string;
}

const worker = new Worker<DocumentJob>(
    "document-processing",

    async (job: Job<DocumentJob>) => {
        const { documentId } = job.data;

        console.log(
            `Starting job ${job.id} for document ${documentId}`
        );

        try {
            // ---------------------------------------------
            // 1. Mark document as processing
            // ---------------------------------------------

            await prisma.document.update({
                where: {
                    id: documentId,
                },

                data: {
                    status: "PROCESSING",
                    attempts: job.attemptsMade + 1,
                    progress: 10,
                    errorMessage: null,
                },
            });

            await job.updateProgress(10);

            // ---------------------------------------------
            // 2. Get PDF bytes from PostgreSQL
            // ---------------------------------------------

            console.log(
                `Getting PDF data for document ${documentId}`
            );

            const document =
                await prisma.document.findUnique({
                    where: {
                        id: documentId,
                    },

                    select: {
                        pdfData: true,
                    },
                });

            if (!document) {
                throw new Error(
                    `Document ${documentId} not found`
                );
            }

            if (!document.pdfData) {
                throw new Error(
                    `PDF data not found for document ${documentId}`
                );
            }

            await job.updateProgress(30);

            await prisma.document.update({
                where: {
                    id: documentId,
                },

                data: {
                    progress: 30,
                },
            });

            // ---------------------------------------------
            // 3. Extract PDF text
            // ---------------------------------------------

            console.log(
                `Extracting PDF text for ${documentId}`
            );

            const parser = new PDFParse({
                data: Buffer.from(document.pdfData),
            });

            const pdfResult = await parser.getText();

            const extractedText = pdfResult.text;

            await parser.destroy();

            await job.updateProgress(80);

            await prisma.document.update({
                where: {
                    id: documentId,
                },

                data: {
                    progress: 80,
                },
            });

            // ---------------------------------------------
            // 4. Save extracted text
            // ---------------------------------------------

            console.log(
                `Saving extracted text for ${documentId}`
            );

            await prisma.document.update({
                where: {
                    id: documentId,
                },

                data: {
                    status: "COMPLETED",
                    extractedText,
                    progress: 100,
                    completedAt: new Date(),
                    errorMessage: null,
                },
            });

            await job.updateProgress(100);

            console.log(
                `Job ${job.id} completed successfully`
            );

            return {
                documentId,
                charactersExtracted:
                    extractedText.length,
            };
        } catch (error) {
            console.error(
                `Job ${job.id} failed:`,
                error
            );

            try {
                await prisma.document.update({
                    where: {
                        id: documentId,
                    },

                    data: {
                        status: "FAILED",

                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : "Unknown error",
                    },
                });
            } catch (updateError) {
                console.error(
                    "Failed to update document status:",
                    updateError
                );
            }

            throw error;
        }
    },

    {
        connection: redis,
        concurrency: 3,
    }
);

worker.on("completed", (job) => {
    console.log(
        `Worker completed job ${job.id}`
    );
});

worker.on("failed", (job, error) => {
    console.error(
        `Worker failed job ${job?.id}:`,
        error.message
    );
});

worker.on("error", (error) => {
    console.error(
        "Worker error:",
        error
    );
});

console.log(
    "Document processing worker started..."
);
