import { books } from "@/server/rpc/books";
import { health } from "@/server/rpc/health";
import { os } from "@/server/rpc/os";

export const router = os.router({
  health,
  books,
});
