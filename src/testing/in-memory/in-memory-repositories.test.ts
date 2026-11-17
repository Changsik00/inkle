import { describeBookRepositoryContract } from "@/testing/contracts/book-repository.contract";
import { describeJobRepositoryContract } from "@/testing/contracts/job-repository.contract";
import { describeUserRepositoryContract } from "@/testing/contracts/user-repository.contract";
import { InMemoryBookRepository } from "@/testing/in-memory/in-memory-book-repository";
import { InMemoryJobRepository } from "@/testing/in-memory/in-memory-job-repository";
import { InMemoryUserRepository, localUser } from "@/testing/in-memory/in-memory-user-repository";

describeJobRepositoryContract("메모리", async () => new InMemoryJobRepository());
describeUserRepositoryContract("메모리", async () => new InMemoryUserRepository([localUser()]));
describeBookRepositoryContract("메모리", async () => new InMemoryBookRepository());
