import { background } from "./background";
import { books } from "./books";
import { health } from "./health";
import { os } from "./os";
import { perspectives } from "./perspectives";
import { sessions } from "./sessions";

export const router = os.router({
  health,
  books,
  sessions,
  background,
  perspectives,
});
