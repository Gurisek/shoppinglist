import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../../db/dbConect";
import ShoppingList from "../../../Model/ShoppingList";
import { authenticateUser } from "../../../Auth/middleware";

export async function POST(
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

    const body = await req.json();
    const { name, quantity } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return new Response(
        JSON.stringify({ message: "Item name is required" }),
        { status: 400 }
      );
    }

    if (
      quantity === undefined ||
      typeof quantity !== "number" ||
      quantity < 1
    ) {
      return new Response(
        JSON.stringify({ message: "Valid quantity is required (min 1)" }),
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(authUser.userId);

    // Find list where user is owner or member
    const shoppingList = await ShoppingList.findOne({
      _id: new mongoose.Types.ObjectId(id),
      $or: [{ ownerId: userObjectId }, { memberIds: userObjectId }],
    });

    if (!shoppingList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found or unauthorized" }),
        { status: 404 }
      );
    }

    // Add item to the list
    const newItem = {
      name: name.trim(),
      quantity,
      purchased: false,
    };

    await ShoppingList.findByIdAndUpdate(
      id,
      { $push: { items: newItem } },
      { new: true }
    );

    return NextResponse.json(
      { message: "Item added successfully", item: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
