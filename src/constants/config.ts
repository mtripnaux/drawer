export const CENTER_ID = "fb98bd92-1daa-4249-be13-96e547918761";

export const defaultUserConfig = {
  nameDisplayPattern: "FIRST LAST", // Options: "FIRST LAST", "LAST, FIRST", "TITLE FIRST MIDDLE LAST"
  showDeceasedPeople: false, // true or false
};

export type UserConfig = typeof defaultUserConfig;
