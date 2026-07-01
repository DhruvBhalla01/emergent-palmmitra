import { api } from "./api";

export const track = (type, meta = {}) => {
  // Fire-and-forget; never blocks UI
  api.post("/analytics/event", { type, meta }).catch(() => {});
};
