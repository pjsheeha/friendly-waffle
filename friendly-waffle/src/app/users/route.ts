import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Client } from "pg";

interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

function getClient() {
  return new Client({
    connectionString: process.env.PGSQL_URL, //creates a PostgreSQL client
  });
}


async function readUsers(): Promise<User[]> {
  const client = getClient(); //gets all users from the database
  await client.connect();

  try {
    const result = await client.query("SELECT id, name, email, age FROM users"); //SELECT tells the database to retrieve read data. we specifically want the id, name, email, age from the users table
    return result.rows;
  } finally {
    await client.end();
  }
}

async function writeUsers(users: User[]) {
  const client = getClient();
  await client.connect();

  try {
    const insertQuery = `
      INSERT INTO users (id, name, email, age)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        age = EXCLUDED.age;
    `; //adds a new user into the database or updates them if they already exist. insert+ update. $1, $2, $3, $4 are placeholders (used in parameterized queries to safely pass values and prevent SQL injection) DO UPDATe updates the existing row with the new values

    for (const user of users) {
      await client.query(insertQuery, [user.id, user.name, user.email, user.age]); //this fills in the $1, $2, etc
    }
  } finally {
    await client.end();
  }
}


export async function GET() {
  try {
    const users = await readUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error("Error reading users from DB:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const users: User[] = Array.isArray(body) ? body : [body];

    await writeUsers(users);

    return NextResponse.json({ success: true, count: users.length });
  } catch (err) {
    console.error("Error writing users to DB:", err);
    return NextResponse.json({ error: "Failed to write users" }, { status: 500 });
  }
}
