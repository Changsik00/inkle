"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { emptyMessage, GENRE_LABEL, tooLongMessage, violationMessage } from "@/features/books/labels";
import { api, ApiError } from "@/api-client";
import { BOOK_AUTHOR_MAX, BOOK_TITLE_MAX, bookSchema, bookViolationSchema, type BookDto } from "@inkle/contract/books";
import { Button } from "@/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/ui/field";
import { Input } from "@/ui/input";

const chars = (s: string) => [...s.trim().replace(/\s+/g, " ")].length;

// 서버(도메인)와 같은 규칙을 먼저 확인해 불필요한 요청을 줄인다. 최종 판단은 서버가 한다.
const formSchema = z.object({
  title: z
    .string()
    .refine((s) => chars(s) > 0, emptyMessage("title"))
    .refine((s) => chars(s) <= BOOK_TITLE_MAX, tooLongMessage("title", BOOK_TITLE_MAX)),
  author: z
    .string()
    .refine((s) => chars(s) > 0, emptyMessage("author"))
    .refine((s) => chars(s) <= BOOK_AUTHOR_MAX, tooLongMessage("author", BOOK_AUTHOR_MAX)),
});

type FormValues = z.infer<typeof formSchema>;

const conflictData = z.object({ book: bookSchema });
const invalidData = z.object({ violations: z.array(bookViolationSchema) });

export function BookRegisterForm({ onRegistered }: { onRegistered: (book: BookDto) => void }) {
  const queryClient = useQueryClient();
  const [existing, setExisting] = useState<BookDto | null>(null);
  const [failed, setFailed] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", author: "" },
  });

  const register = useMutation({
    ...api.books.register.mutationOptions(),
    onSuccess: async (book) => {
      await queryClient.invalidateQueries({ queryKey: api.books.key() });
      onRegistered(book);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "CONFLICT") {
        const parsed = conflictData.safeParse(error.data);
        if (parsed.success) return setExisting(parsed.data.book);
      }
      if (error instanceof ApiError && error.code === "INVALID_BOOK") {
        const parsed = invalidData.safeParse(error.data);
        if (parsed.success) {
          for (const v of parsed.data.violations) form.setError(v.field, { message: violationMessage(v) });
          return;
        }
      }
      setFailed(true);
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setExisting(null);
    setFailed(false);
    register.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-title">제목</FieldLabel>
              <Input {...field} id="book-title" autoComplete="off" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="author"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="book-author">작가</FieldLabel>
              <Input {...field} id="book-author" autoComplete="off" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <p className="text-body-sm text-muted-foreground">장르: {GENRE_LABEL.fiction}</p>
      </FieldGroup>

      {existing && (
        <div role="status" className="flex flex-col items-start gap-3 border-l-2 border-rule-strong pl-4">
          <p>이미 등록된 책이에요</p>
          <Button asChild variant="outline">
            <Link href={`/books/${existing.id}`}>등록된 책 보기</Link>
          </Button>
        </div>
      )}
      {failed && (
        <p role="alert" className="text-body-sm text-destructive">
          등록하지 못했어요. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}

      <div>
        <Button type="submit" disabled={register.isPending}>
          등록
        </Button>
      </div>
    </form>
  );
}
