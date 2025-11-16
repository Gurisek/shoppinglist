import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../../../db/dbConect";
import ShoppingList from "../../../../Model/ShoppingList";
import User from "../../../../Model/User";
import { authenticateUser } from "../../../../Auth/middleware";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id, memberId } = await params;
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      return new Response(JSON.stringify({ message: "Invalid ID" }), {
        status: 400,
      });
    }

    // Find the shopping list and verify ownership
    const shoppingList = await ShoppingList.findOne({
      _id: new mongoose.Types.ObjectId(id),
      ownerId: new mongoose.Types.ObjectId(authUser.userId),
    });

    if (!shoppingList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found or unauthorized" }),
        { status: 404 }
      );
    }

    const memberObjectId = new mongoose.Types.ObjectId(memberId);

    // Check if user is actually a member
    if (
      !shoppingList.memberIds.some((mid: mongoose.Types.ObjectId) =>
        mid.equals(memberObjectId)
      )
    ) {
      return new Response(
        JSON.stringify({ message: "User is not a member of this list" }),
        { status: 400 }
      );
    }

    // Remove user from memberIds
    await ShoppingList.findByIdAndUpdate(id, {
      $pull: { memberIds: memberObjectId },
    });

    // Remove list from user's memberOf
    await User.findByIdAndUpdate(memberId, {
      $pull: { memberOf: new mongoose.Types.ObjectId(id) },
    });

    return NextResponse.json(
      { message: "Member removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
