export const CENTER_ID = "fb98bd92-1daa-4249-be13-96e547918761";

export type ProfileActionId = 'phone' | 'message' | 'instagram' | 'facebook' | 'linkedin' | 'twitter';

export const DEFAULT_RELATION_WEIGHTS: Record<string, number> = {
  "Sibling": 0.4,
  "Spouse": 0.5,
  "Partner": 0.6,
  "Child": 0.65,
  "Parent": 0.65,
  "Friend": 0.7,
  "Half-Sibling": 0.75,
  "Colleague": 1.5,
  "Boss": 2,
  "Employee": 2,
  "Ex": 3
};

export const defaultUserConfig = {
  centerId: CENTER_ID,
  tupperBaseUri: "http://127.0.0.1:3058",
  secretAccessToken: "super-secret-token",
  nameDisplayPattern: "TITLE FIRST LAST",
  showDeceasedPeople: false,
  hideContactsWithoutPhone: false,
  sortBy: "PROXIMITY",
  dateFormat: "DD/MM/YYYY",
  darkTheme: false,
  relationWeights: { ...DEFAULT_RELATION_WEIGHTS },
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
