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

    const body = await req.json();
    const { email, userId } = body;

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

    // Find user to add by email or userId
    let userToAdd;
    if (email) {
      userToAdd = await User.findOne({ email });
    } else if (userId) {
      userToAdd = await User.findById(userId);
    } else {
      return new Response(
        JSON.stringify({ message: "Email or userId is required" }),
        { status: 400 }
      );
    }

    if (!userToAdd) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    // Check if user is already a member or owner
    const userObjectId = new mongoose.Types.ObjectId(userToAdd._id);
    if (shoppingList.ownerId.equals(userObjectId)) {
      return new Response(
        JSON.stringify({ message: "User is already the owner" }),
        { status: 400 }
      );
    }

    if (
      shoppingList.memberIds.some((memberId: mongoose.Types.ObjectId) =>
        memberId.equals(userObjectId)
      )
    ) {
      return new Response(
        JSON.stringify({ message: "User is already a member" }),
        { status: 400 }
      );
    }

    // Add user to memberIds
    await ShoppingList.findByIdAndUpdate(id, {
      $push: { memberIds: userObjectId },
    });

    // Add list to user's memberOf
    await User.findByIdAndUpdate(userToAdd._id, {
      $push: { memberOf: new mongoose.Types.ObjectId(id) },
    });

    return NextResponse.json(
      { message: "Member added successfully", memberId: userToAdd._id },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}

// Return member and owner details (id, name, surname, email) if requester is owner or member
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
    const userObjectId = new mongoose.Types.ObjectId(authUser.userId);
    const list = await ShoppingList.findOne({
      _id: new mongoose.Types.ObjectId(id),
      $or: [{ ownerId: userObjectId }, { memberIds: userObjectId }],
    })
      .populate("ownerId", "name surname email")
      .populate("memberIds", "name surname email");

    if (!list) {
      return new Response(
        JSON.stringify({ message: "Shopping list not found or unauthorized" }),
        { status: 404 }
      );
    }

    const ownerDoc = list.ownerId as unknown as typeof User & {
      _id: mongoose.Types.ObjectId;
      name: string;
      surname: string;
      email: string;
    };
    const membersDocs = list.memberIds as unknown as Array<
      typeof User & {
        _id: mongoose.Types.ObjectId;
        name: string;
        surname: string;
        email: string;
      }
    >;

    const owner = {
      userId: ownerDoc._id.toString(),
      name: ownerDoc.name,
      surname: ownerDoc.surname,
      email: ownerDoc.email,
    };
    const members = membersDocs.map((m) => ({
      userId: m._id.toString(),
      name: m.name,
      surname: m.surname,
      email: m.email,
    }));

    return NextResponse.json({ owner, members }, { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
  }
}
