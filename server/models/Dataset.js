import mongoose from "mongoose";

// One document per user, mirroring exactly what the frontend's zustand dataset store persists to
// localStorage — data/fileName/analysis/aiAnalysis/history — so syncing is a straight read/write
// of this whole shape rather than modeling every dataset field individually.
const datasetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  data: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  fileName: {
    type: String,
    default: null,
  },
  analysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  history: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Dataset = mongoose.model("Dataset", datasetSchema);
