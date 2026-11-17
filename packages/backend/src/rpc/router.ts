import { books } from "./books";
import { health } from "./health";
import { os } from "./os";

export const router = os.router({
  health,
  books,
});
