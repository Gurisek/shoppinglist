import mongoose from "mongoose";
import { IShoppingListDocument } from "./ShoppingList";

export interface IUser {
  email: string;
  password: string;
  name: string;
  surname: string;
  tokens: string[];
}

export interface IUserDocument extends IUser, mongoose.Document {
  ownedLists: mongoose.Types.ObjectId[] | IShoppingListDocument[];
  memberOf: mongoose.Types.ObjectId[] | IShoppingListDocument[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    surname: { type: String, required: true },
    tokens: [{ type: String }],
    ownedLists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShoppingList",
      },
    ],
    memberOf: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ShoppingList",
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
