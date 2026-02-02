import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const client = new Client({
    connectionString: process.env.PGSQL_URL,
  });

  try {
    await client.connect();
    await client.end();
    return NextResponse.json({ message: "Connected to database" });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ message: "Connection failed" }, { status: 500 });
  }
}
