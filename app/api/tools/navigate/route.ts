import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url, label } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Opening ${label || url}...`,
      _cards: [
        {
          auto_open: true,
          title: `Opening ${label || "page"}...`,
          actions: [
            {
              action: "open_url",
              label: label || "Open",
              payload: { url },
            },
          ],
        },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
