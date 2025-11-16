import dbConect from "../../db/dbConect";
import User from "@/app/api/Model/User";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  name: z.string().min(1, { message: "Name is required" }),
  surname: z.string().min(1, { message: "Surname is required" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least 1 capital letter" }),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name, surname, password } = parsed.data;

    await dbConect();

    // Check if email already exists
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      name,
      surname,
      password: hashedPassword,
    });

    const maybe = newUser as unknown as {
      toObject?: () => Record<string, unknown>;
    };
    const userObj =
      maybe.toObject && typeof maybe.toObject === "function"
        ? maybe.toObject()
        : (newUser as unknown as Record<string, unknown>);
    const userSafe: Record<string, unknown> = { ...userObj };
    if ("password" in userSafe) delete userSafe["password"];
    if ("_id" in userSafe) delete userSafe["_id"];

    return NextResponse.json(
      { message: "User registered", user: userSafe },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}