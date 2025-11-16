import mongoose from "mongoose";
import { NextResponse } from "next/server";
import dbConect from "../../db/dbConect";
import ShoppingList, { IShoppingListDocument } from "../../Model/ShoppingList";
import User from "../../Model/User";
import { authenticateUser } from "../../Auth/middleware";

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
    const shoppingList: IShoppingListDocument | null =
      await ShoppingList.findOne({
        _id: new mongoose.Types.ObjectId(id),
        $or: [
          { ownerId: new mongoose.Types.ObjectId(authUser.userId) },
          { memberIds: new mongoose.Types.ObjectId(authUser.userId) },
        ],
      });
    if (!shoppingList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found" }),
        {
          status: 404,
        }
      );
    }
    return NextResponse.json({ shoppingList }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function PATCH(
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
    const { title, status } = body as {
      title?: string;
      status?: "active" | "completed" | "archived";
    };

    // Build update payload based on provided fields
    const update: Record<string, unknown> = {};
    if (typeof title === "string") {
      const t = title.trim();
      if (!t) {
        return new Response(JSON.stringify({ message: "Title is required" }), {
          status: 400,
        });
      }
      update.title = t;
    }
    if (typeof status === "string") {
      const allowed = new Set(["active", "completed", "archived"]);
      if (!allowed.has(status)) {
        return new Response(JSON.stringify({ message: "Invalid status" }), {
          status: 400,
        });
      }
      update.status = status;
    }

    if (Object.keys(update).length === 0) {
      return new Response(
        JSON.stringify({ message: "No valid fields to update" }),
        {
          status: 400,
        }
      );
    }

    // Update only if user is owner
    const updatedList = await ShoppingList.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(id),
        ownerId: new mongoose.Types.ObjectId(authUser.userId),
      },
      update,
      { new: true }
    );

    if (!updatedList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found or unauthorized" }),
        { status: 404 }
      );
    }

    return NextResponse.json({ shoppingList: updatedList }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

export async function DELETE(
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
    const deletedShoppingList = await ShoppingList.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      ownerId: new mongoose.Types.ObjectId(authUser.userId),
    });
    if (!deletedShoppingList) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found" }),
        {
          status: 404,
        }
      );
    }
    // Remove list id from owner's ownedLists
    await User.findByIdAndUpdate(
      new mongoose.Types.ObjectId(authUser.userId),
      { $pull: { ownedLists: new mongoose.Types.ObjectId(id) } },
      { new: true }
    );
    // Remove list id from all users' memberOf
    await User.updateMany(
      { memberOf: new mongoose.Types.ObjectId(id) },
      { $pull: { memberOf: new mongoose.Types.ObjectId(id) } }
    );
    return NextResponse.json(
      { message: "Shopping list deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
