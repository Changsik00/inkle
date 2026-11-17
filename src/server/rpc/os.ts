import { implement } from "@orpc/server";
import { contract } from "@/http/contract";
import type { RpcContext } from "@/server/rpc/context";

export const os = implement(contract).$context<RpcContext>();
