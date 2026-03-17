import { nanoid } from "nanoid";

export function newCardId(): string {
  return nanoid(8);
}

