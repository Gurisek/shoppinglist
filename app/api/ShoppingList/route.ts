import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "./../db/dbConect";
import ShoppingList, { IShoppingListDocument } from "./../Model/ShoppingList";
import User from "./../Model/User";
import { authenticateUser } from "../Auth/middleware";

export async function GET() {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    // Find lists where user is owner OR member
    const shoppingLists: IShoppingListDocument[] = await ShoppingList.find({
      $or: [
        { ownerId: new mongoose.Types.ObjectId(authUser.userId) },
        { memberIds: new mongoose.Types.ObjectId(authUser.userId) },
      ],
    }).sort({ createdAt: -1 }).populate('ownerId', 'email');
    return NextResponse.json({ shoppingLists }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function POST(req: Request) {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }
    const body = await req.json();
    const { title, items } = body as {
      title?: string;
      items?: Array<{ name: string; quantity?: number; purchased?: boolean }>;
    };
    if (!title || typeof title !== "string" || title.trim() === "") {
      return new Response(JSON.stringify({ message: "Title is required" }), {
        status: 400,
      });
    }
    let parsedItems: { name: string; quantity: number; purchased: boolean }[] =
      [];
    if (Array.isArray(items)) {
      parsedItems = items
        .filter(
          (it) => it && typeof it.name === "string" && it.name.trim() !== ""
        )
        .map((it) => ({
          name: it.name.trim(),
          quantity:
            typeof it.quantity === "number" && it.quantity > 0
              ? Math.floor(it.quantity)
              : 1,
          purchased: Boolean(it.purchased) || false,
        }));
    }
    const newShoppingList = new ShoppingList({
      title: title.trim(),
      ownerId: new mongoose.Types.ObjectId(authUser.userId),
      items: parsedItems,
      memberIds: [],
    });
    await newShoppingList.save();

    // Add to user's ownedLists
    await User.findByIdAndUpdate(authUser.userId, {
      $push: { ownedLists: newShoppingList._id },
    });

    return NextResponse.json(
      { shoppingList: newShoppingList },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
