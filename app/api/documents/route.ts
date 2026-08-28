import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { documentQueue } from "@/lib/queue";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    // ---------------------------------------------
    // Validate file
    // ---------------------------------------------

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No file uploaded",
        },
        {
          status: 400,
        }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "Only PDF files are supported",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "PDF must be smaller than 4 MB",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------
    // Convert PDF to Buffer
    // ---------------------------------------------

    const bytes = await file.arrayBuffer();
    const pdfData = Buffer.from(bytes);

    // ---------------------------------------------
    // Save PDF to PostgreSQL
    // ---------------------------------------------

    const document = await prisma.document.create({
      data: {
        filename: file.name,
        originalName: file.name,
        pdfData,
        status: "QUEUED",
        progress: 0,
      },
    });

    // ---------------------------------------------
    // Add processing job to BullMQ
    // ---------------------------------------------

    await documentQueue.add("process-document", {
      documentId: document.id,
    });

    // ---------------------------------------------
    // Return response
    // ---------------------------------------------

    return NextResponse.json(
      {
        message: "Document uploaded successfully",
        documentId: document.id,
        status: document.status,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        error: "Failed to upload document",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: {
        createdAt: "desc",
      },

      take: 20,

      select: {
        id: true,
        filename: true,
        originalName: true,
        status: true,
        progress: true,
        extractedText: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error(
      "Failed to fetch documents:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch documents",
      },
      {
        status: 500,
      }
    );
  }
}