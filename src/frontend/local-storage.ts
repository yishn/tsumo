import { avatarList } from "./assets.ts";

enum Key {
  Avatar = "tsumo.avatar",
  Name = "tsumo.name",
}

export class LocalStorage {
  static get avatar(): number {
    let value = localStorage.getItem(Key.Avatar);

    if (value == null || isNaN(+value) || avatarList[+value] == null) {
      value = Math.floor(Math.random() * avatarList.length).toString();
      localStorage.setItem(Key.Avatar, value);
    }

    return +value;
  }

  static set avatar(value: number) {
    localStorage.setItem(Key.Avatar, value.toString());
  }

  static get name(): string {
    return localStorage.getItem(Key.Name) ?? "";
  }

  static set name(value: string) {
    localStorage.setItem(Key.Name, value);
  }
}
