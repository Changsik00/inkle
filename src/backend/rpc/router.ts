import { books } from "@/backend/rpc/books";
import { health } from "@/backend/rpc/health";
import { os } from "@/backend/rpc/os";

export const router = os.router({
  health,
  books,
});
