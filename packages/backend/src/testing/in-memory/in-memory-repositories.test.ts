import { describeBookRepositoryContract } from "../contracts/book-repository.contract";
import { describeJobRepositoryContract } from "../contracts/job-repository.contract";
import { describeUserRepositoryContract } from "../contracts/user-repository.contract";
import { InMemoryBookRepository } from "./in-memory-book-repository";
import { InMemoryJobRepository } from "./in-memory-job-repository";
import { InMemoryUserRepository, localUser } from "./in-memory-user-repository";

describeJobRepositoryContract("메모리", async () => new InMemoryJobRepository());
describeUserRepositoryContract("메모리", async () => new InMemoryUserRepository([localUser()]));
describeBookRepositoryContract("메모리", async () => new InMemoryBookRepository());
