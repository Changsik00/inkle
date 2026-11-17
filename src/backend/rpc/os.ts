import { implement } from "@orpc/server";
import { contract } from "@/shared/contract";
import type { RpcContext } from "@/backend/rpc/context";

export const os = implement(contract).$context<RpcContext>();
