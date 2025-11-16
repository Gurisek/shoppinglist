import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../../../db/dbConect";
import ShoppingList from "../../../../Model/ShoppingList";
import { authenticateUser } from "../../../../Auth/middleware";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id, itemId } = await params;
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return new Response(JSON.stringify({ message: "Invalid ID" }), {
        status: 400,
      });
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

    // Remove item by _id using $pull
    const result = await ShoppingList.findByIdAndUpdate(
      id,
      { $pull: { items: { _id: new mongoose.Types.ObjectId(itemId) } } },
      { new: true }
    );

    if (!result) {
      return new Response(JSON.stringify({ message: "Item not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(
      { message: "Item removed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    await dbConect();
    const authUser = await authenticateUser();
    if (!authUser) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id, itemId } = await params;
    if (
      !mongoose.Types.ObjectId.isValid(id) ||
      !mongoose.Types.ObjectId.isValid(itemId)
    ) {
      return new Response(JSON.stringify({ message: "Invalid ID" }), {
        status: 400,
      });
    }

    const body = await req.json();
    const { purchased } = body;

    if (typeof purchased !== "boolean") {
      return new Response(
        JSON.stringify({ message: "purchased must be a boolean" }),
        { status: 400 }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(authUser.userId);

    // Find list where user is owner or member and update item
    const shoppingList = await ShoppingList.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        "items._id": new mongoose.Types.ObjectId(itemId),
        $or: [{ ownerId: userObjectId }, { memberIds: userObjectId }],
      },
      { $set: { "items.$.purchased": purchased } },
      { new: true }
    );

    if (!shoppingList) {
      return new Response(
        JSON.stringify({
          message: "Shopping list or item not found or unauthorized",
        }),
        { status: 404 }
      );
    }

    const updatedItem = shoppingList.items.find(
      (item: {
        _id: mongoose.Types.ObjectId;
        name: string;
        quantity: number;
        purchased: boolean;
      }) => item._id.toString() === itemId
    );

    return NextResponse.json(
      { message: "Item updated successfully", item: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
