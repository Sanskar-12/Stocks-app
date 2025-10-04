import mongoose, { Model } from "mongoose";

export interface WatchListItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

const WatchListSchema = new mongoose.Schema<WatchListItem>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// creating index
WatchListSchema.index(
  {
    userId: 1,
    symbol: 1,
  },
  {
    unique: true,
  }
);

export const Watchlist: Model<WatchListItem> =
  (mongoose.models?.Watchlist as Model<WatchListItem>) ||
  mongoose.model<WatchListItem>("Watchlist", WatchListSchema);
