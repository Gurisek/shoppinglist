import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../../db/dbConect";
import ShoppingList from "../../../Model/ShoppingList";
import User from "../../../Model/User";
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

    const userObjectId = new mongoose.Types.ObjectId(authUser.userId);

    // Find the shopping list
    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found" }),
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (shoppingList.ownerId.equals(userObjectId)) {
      return new Response(
        JSON.stringify({
          message: "Owner cannot leave the list. Delete it instead.",
        }),
        { status: 400 }
      );
    }

    // Check if user is actually a member
    if (
      !shoppingList.memberIds.some((mid: mongoose.Types.ObjectId) =>
        mid.equals(userObjectId)
      )
    ) {
      return new Response(
        JSON.stringify({ message: "You are not a member of this list" }),
        { status: 400 }
      );
    }

    // Remove user from memberIds
    await ShoppingList.findByIdAndUpdate(id, {
      $pull: { memberIds: userObjectId },
    });

    // Remove list from user's memberOf
    await User.findByIdAndUpdate(authUser.userId, {
      $pull: { memberOf: new mongoose.Types.ObjectId(id) },
    });

    return NextResponse.json(
      { message: "Successfully left the shopping list" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
