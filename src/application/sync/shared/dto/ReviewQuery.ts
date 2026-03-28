// src/application/sync/dto/ReviewQuery.ts

export type ReviewQuery = {
  list: string;
  preset?: "today" | "date";
  date?: string;
};
