import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { audioUrl, targetLanguage, docId } = await request.json();

    // Forward request to your backend
    const backendResponse = await fetch("https://python-server-q30o.onrender.com/process-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl, targetLanguage, docId }),
    });

    if (!backendResponse.ok) {
      const text = await backendResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: `Backend error: ${backendResponse.status} - ${text}`,
        },
        { status: 500 }
      );
    }

    const backendJson = await backendResponse.json()

    return NextResponse.json({
      success: true,
      language: targetLanguage,
      url: backendJson.url,
      
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

// import { NextRequest, NextResponse } from "next/server";

// export async function POST(request: NextRequest) {
//   try {
//     const { audioUrl, targetLanguage, docId } = await request.json();

//     // Forward request to your backend
//     const backendResponse = await fetch("http://127.0.0.1:8000/process-audio", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ audioUrl, targetLanguage, docId }),
//     });

//     if (!backendResponse.ok) {
//       const text = await backendResponse.text();
//       return NextResponse.json(
//         { success: false, error: `Backend error: ${backendResponse.status} - ${text}` },
//         { status: 500 }
//       );
//     }

//     // Your backend is returning raw audio (wav) data, which is binary
//     // You can't directly send the binary as JSON — instead stream it or
//     // save and return a URL or base64-encoded string.

//     // For simplicity, convert the audio blob to base64 string
//     const buffer = await backendResponse.arrayBuffer();
//     const base64Audio = Buffer.from(buffer).toString("base64");

//     return NextResponse.json({
//       success: true,
//       language: targetLanguage,
//       audioBase64: base64Audio,
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { success: false, error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }
