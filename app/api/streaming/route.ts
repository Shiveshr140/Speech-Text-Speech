import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, targetLanguage, docId } = await request.json();

    const backendResponse = await fetch("https://python-server-q30o.onrender.com/process-audio/stream-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, targetLanguage, docId }),
    });

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      return NextResponse.json(
        { success: false, error: `Backend error: ${backendResponse.status} - ${text}` },
        { status: 500 }
      );
    }

    // Here, backendResponse.body is a ReadableStream of audio data (e.g. wav)
    // We forward this stream as-is to the client with proper headers:

    return new NextResponse(backendResponse.body, {
      headers: {
        "Content-Type": backendResponse.headers.get("Content-Type") || "audio/wav",
        "Transfer-Encoding": "chunked",
        // You can add CORS headers here if needed
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
