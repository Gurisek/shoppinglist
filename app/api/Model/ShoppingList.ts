import mongoose from "mongoose";
import { IUserDocument } from "./User";

export interface IShoppingList {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  items: { name: string; quantity: number; purchased: boolean }[];
  status: "active" | "completed" | "archived";
}

export interface IShoppingListDocument
  extends Omit<IShoppingList, "ownerId" | "memberIds">,
    mongoose.Document {
  ownerId: IUserDocument["_id"];
  title: string;
  items: { name: string; quantity: number; purchased: boolean }[];
  status: "active" | "completed" | "archived";
  memberIds: IUserDocument["_id"][];
  createdAt: Date;
  updatedAt: Date;
}

const ShoppingListSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        purchased: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

const ShoppingList =
  mongoose.models.ShoppingList ||
  mongoose.model("ShoppingList", ShoppingListSchema);

export default ShoppingList;
