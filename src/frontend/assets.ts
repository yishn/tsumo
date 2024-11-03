export { default as BambooIcon } from "../../assets/icons/bamboo.svg";
export { default as CircleIcon } from "../../assets/icons/circle.svg";
export { default as FlowerIcon } from "../../assets/icons/flower.svg";
export { default as WindIcon } from "../../assets/icons/wind.svg";
export { default as WhiteIcon } from "../../assets/icons/white.svg";

export { default as ScoreIcon } from "../../assets/icons/score.svg";
export { default as DealerIcon } from "../../assets/icons/dealer.svg";

export { default as SubmitIcon } from "../../assets/icons/submit.svg";
export { default as ErrorIcon } from "../../assets/icons/error.svg";
export { default as ReloadIcon } from "../../assets/icons/reload.svg";
export { default as InviteIcon } from "../../assets/icons/invite.svg";
export { default as DiscardIcon } from "../../assets/icons/discard.svg";
export { default as DrawIcon } from "../../assets/icons/draw.svg";
export { default as EatIcon } from "../../assets/icons/eat.svg";
export { default as PongIcon } from "../../assets/icons/pong.svg";
export { default as KongIcon } from "../../assets/icons/kong.svg";
export { default as WinIcon } from "../../assets/icons/win.svg";
export { default as LeftIcon } from "../../assets/icons/left.svg";
export { default as RightIcon } from "../../assets/icons/right.svg";

export const avatarList = [
  "rat",
  "ox",
  "tiger",
  "rabbit",
  "dragon",
  // "snake",
  // "horse",
  // "goat",
  "monkey",
  "rooster",
  "dog",
  "boar",
] as const;

export function getAvatarUrl(avatar: number): string {
  return `./assets/avatars/${avatarList[(avatar + avatarList.length) % avatarList.length]}.png`;
}

export function getAvatarColor(avatar: number): string {
  return [
    "#4e3f63",
    "#85874e",
    "#b7b2b4",
    "#189662",
    "#8dbced",
    "#c45c3f",
    "#f0e56e",
    "#9c6850",
    "#1b728f",
  ][(avatar + avatarList.length) % avatarList.length];
}
