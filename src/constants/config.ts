export const CENTER_ID = "fb98bd92-1daa-4249-be13-96e547918761";

export type ProfileActionId = 'phone' | 'message' | 'instagram' | 'facebook' | 'linkedin' | 'twitter';

export const defaultUserConfig = {
  centerId: CENTER_ID,
  tupperBaseUri: "http://217.145.72.68:3058",
  secretAccessToken: "super-secret-token",
  nameDisplayPattern: "TITLE FIRST LAST",
  showDeceasedPeople: false,
  hideContactsWithoutPhone: false,
  sortBy: "PROXIMITY", // "PROXIMITY", "ALPHABETICAL", "RECENTLY_ADDED"
  dateFormat: "DD/MM/YYYY",
  darkTheme: false,
  profileActions: [
    { id: 'phone' as ProfileActionId, enabled: true },
    { id: 'message' as ProfileActionId, enabled: true },
    { id: 'instagram' as ProfileActionId, enabled: true },
    { id: 'facebook' as ProfileActionId, enabled: true },
    { id: 'linkedin' as ProfileActionId, enabled: true },
    { id: 'twitter' as ProfileActionId, enabled: true },
  ],
};

export type UserConfig = typeof defaultUserConfig;
