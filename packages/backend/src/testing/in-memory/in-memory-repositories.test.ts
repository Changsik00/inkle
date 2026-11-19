import { describeCollectionRepositoryContract } from "../contracts/collection-repository.contract";
import { describeConnectionRepositoryContract } from "../contracts/connection-repository.contract";
import { describeBookRepositoryContract } from "../contracts/book-repository.contract";
import { describeJobRepositoryContract } from "../contracts/job-repository.contract";
import { describeSessionRepositoryContract } from "../contracts/session-repository.contract";
import { describeUserRepositoryContract } from "../contracts/user-repository.contract";
import { InMemoryBookRepository } from "./in-memory-book-repository";
import { InMemoryCollectionRepository } from "./in-memory-collection-repository";
import { InMemoryConnectionRepository } from "./in-memory-connection-repository";
import { InMemoryJobRepository } from "./in-memory-job-repository";
import { InMemoryInterpretationRepository, InMemorySessionRepository } from "./in-memory-session-repository";
import { InMemoryUserRepository, localUser } from "./in-memory-user-repository";

describeJobRepositoryContract("메모리", async () => new InMemoryJobRepository());
describeUserRepositoryContract("메모리", async () => new InMemoryUserRepository([localUser()]));
describeBookRepositoryContract("메모리", async () => new InMemoryBookRepository());
describeSessionRepositoryContract("메모리", async () => ({
  sessions: new InMemorySessionRepository(),
  interpretations: new InMemoryInterpretationRepository(),
  userId: "00000000-0000-4000-8000-000000000001",
  otherUserId: "00000000-0000-4000-8000-000000000002",
  bookId: "00000000-0000-4000-8000-0000000000b1",
  otherBookId: "00000000-0000-4000-8000-0000000000b2",
}));
describeCollectionRepositoryContract("메모리", async () => ({
  collections: new InMemoryCollectionRepository(),
  bookId: "00000000-0000-4000-8000-0000000000b1",
  otherBookId: "00000000-0000-4000-8000-0000000000b2",
}));
describeConnectionRepositoryContract("메모리", async () => ({
  connections: new InMemoryConnectionRepository(),
  sessionId: "00000000-0000-4000-8000-0000000000a1",
  collectionId: "00000000-0000-4000-8000-0000000000c1",
  otherCollectionId: "00000000-0000-4000-8000-0000000000c2",
  backgroundItemIds: ["00000000-0000-4000-8000-0000000000d1", "00000000-0000-4000-8000-0000000000d2"],
}));
