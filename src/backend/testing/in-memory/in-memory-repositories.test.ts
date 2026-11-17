import { describeBookRepositoryContract } from "@/backend/testing/contracts/book-repository.contract";
import { describeJobRepositoryContract } from "@/backend/testing/contracts/job-repository.contract";
import { describeUserRepositoryContract } from "@/backend/testing/contracts/user-repository.contract";
import { InMemoryBookRepository } from "@/backend/testing/in-memory/in-memory-book-repository";
import { InMemoryJobRepository } from "@/backend/testing/in-memory/in-memory-job-repository";
import { InMemoryUserRepository, localUser } from "@/backend/testing/in-memory/in-memory-user-repository";

describeJobRepositoryContract("메모리", async () => new InMemoryJobRepository());
describeUserRepositoryContract("메모리", async () => new InMemoryUserRepository([localUser()]));
describeBookRepositoryContract("메모리", async () => new InMemoryBookRepository());
