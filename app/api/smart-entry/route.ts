import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Extract the transaction details from this text: "${prompt}"`,
      config: {
        systemInstruction: "You are a personal finance assistant. Extract the transaction details from the user's input. Today's date is " + new Date().toISOString().split('T')[0] + ". If the user doesn't specify a date, use today's date.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The name of the merchant or source of the transaction.",
            },
            amount: {
              type: Type.NUMBER,
              description: "The amount of the transaction as a positive number.",
            },
            category: {
              type: Type.STRING,
              description: "The category of the transaction. Must be one of: Housing, Food, Transportation, Entertainment, Shopping, Utilities, Health, Other. Defaults to 'Other' if not obvious.",
            },
            type: {
              type: Type.STRING,
              description: "Must be 'expense' or 'income'. 'expense' implies money spent, 'income' implies money earned/received.",
            },
            date: {
              type: Type.STRING,
              description: "The date of the transaction in YYYY-MM-DD format.",
            }
          },
          required: ["title", "amount", "category", "type", "date"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Smart entry error:", error);
    return NextResponse.json({ error: "An error occurred during smart entry" }, { status: 500 });
  }
}
