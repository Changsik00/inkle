import { books } from "./books";
import { health } from "./health";
import { os } from "./os";
import { sessions } from "./sessions";

export const router = os.router({
  health,
  books,
  sessions,
});
