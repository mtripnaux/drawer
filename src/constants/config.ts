export const CENTER_ID = "fb98bd92-1daa-4249-be13-96e547918761";

export const defaultUserConfig = {
  nameDisplayPattern: "TITLE FIRST LAST",
  showDeceasedPeople: false,
  sortBy: "PROXIMITY", // "PROXIMITY", "ALPHABETICAL"
  dateFormat: "DD/MM/YYYY",
  darkTheme: false,
};

export type UserConfig = typeof defaultUserConfig;
