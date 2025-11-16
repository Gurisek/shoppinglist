import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../../../db/dbConect";
import ShoppingList from "../../../../Model/ShoppingList";
import User from "../../../../Model/User";
import { authenticateUser } from "../../../../Auth/middleware";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ message: "Invalid ID" }), {
        status: 400,
      });
    }

    const list = await ShoppingList.findById(id);
    if (!list) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found" }),
        { status: 404 }
      );
    }

    // Only owner can fetch candidates
    if (!list.ownerId.equals(new mongoose.Types.ObjectId(authUser.userId))) {
      return new Response(JSON.stringify({ message: "Forbidden" }), {
        status: 403,
      });
    }

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();

    const excludeIds = [list.ownerId, ...list.memberIds].map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const findFilter: Record<string, unknown> = {
      _id: { $nin: excludeIds },
    };
    if (q) {
      findFilter.$or = [
        { email: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
        { surname: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(findFilter)
      .sort({ email: 1 })
      .limit(50)
      .select("email name surname");

    const candidates = users.map((u) => ({
      userId: u._id.toString(),
      email: u.email,
      name: u.name,
      surname: u.surname,
    }));

    return NextResponse.json({ candidates }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
