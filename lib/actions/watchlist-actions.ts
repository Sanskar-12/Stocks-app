"use server";

import { Watchlist } from "@/db/models/watchlist.model";
import { connectToDb } from "@/db/mongoose";

export const getWatchlistSymbolsByEmail = async (email: string) => {
  try {
    const mongoose = await connectToDb();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Mongoose connection not connected");
    }

    // Fetch user with the help of email
    const user = await db.collection("user").findOne<{
      _id?: unknown;
      id?: string;
      email?: string;
    }>({
      email,
    });

    console.log(user);

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || "");

    if (!userId) return [];

    const items = await Watchlist.find(
      { userId },
      {
        symbol: 1,
      }
    ).lean();

    const filteredItems = items.map((item) => String(item.symbol));

    return filteredItems;
  } catch (error) {
    console.error("Get WatchList By Email Error: ", error);
    return [];
  }
};
