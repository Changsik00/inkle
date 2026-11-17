import { implement } from "@orpc/server";
import { contract } from "@inkle/contract";
import type { RpcContext } from "./context";

export const os = implement(contract).$context<RpcContext>();
