"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ANSWER_MAX,
  interpretationViolationSchema,
  type InterpretationDto,
  type SessionViewDto,
} from "@inkle/contract/sessions";
import { useState } from "react";
import { z } from "zod";
import { api, ApiError } from "@/api-client";
import { formatDate, violationMessage } from "@/features/sessions/labels";
import { useDraft } from "@/features/writing/use-draft";
import { Button } from "@/ui/button";
import { Textarea } from "@/ui/textarea";

type Answers = Record<string, string>;

const chars = (s: string) => [...s].length;
const invalidData = z.object({ violations: z.array(interpretationViolationSchema) });

/**
 * 내 해석 쓰기 (spec-01-07). 독자가 반드시 쓰는 곳은 여기 한 번뿐이다 (docs/goals.md §원칙).
 * 글은 "내가 쓴 글" 잉크(ink-me)로 보인다 (DESIGN.md §Colors).
 */
export function InterpretationForm({ view }: { view: SessionViewDto }) {
  // 방금 저장한 판은 모임 조회를 다시 받기 전에도 바로 보여 준다. 둘 중 최근 판을 쓴다.
  const [justSaved, setJustSaved] = useState<InterpretationDto | null>(null);
  const saved =
    justSaved && (!view.interpretation || justSaved.version >= view.interpretation.version) ? justSaved : view.interpretation;
  const [editing, setEditing] = useState(view.interpretation === null);

  if (saved && !editing) {
    return (
      <div className="flex flex-col gap-8">
        {justSaved !== null && (
          <div role="status" className="flex flex-col gap-1 border-l-2 border-rule-strong pl-4">
            <p className="text-label">저장했어요</p>
            <p className="text-body-sm text-muted-foreground">배경과 다른 시선은 다음 단계에서 볼 수 있어요. 지금은 준비 중이에요.</p>
          </div>
        )}
        <p className="text-caption text-muted-foreground">
          내가 씀 · 판 {saved.version} · {formatDate(saved.createdAt)}
        </p>
        <dl className="flex flex-col gap-6">
          {view.questionSet.questions
            .filter((q) => saved.answers.some((a) => a.questionId === q.id))
            .map((q) => (
              <div key={q.id} className="flex flex-col gap-2">
                <dt className="text-label">{q.text}</dt>
                <dd className="text-body-reading whitespace-pre-line text-ink-me">
                  {saved.answers.find((a) => a.questionId === q.id)?.text}
                </dd>
              </div>
            ))}
        </dl>
        <div>
          <Button variant="outline" onClick={() => setEditing(true)}>
            고쳐 쓰기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EditForm
      view={view}
      latest={saved}
      onSaved={(interpretation) => {
        setJustSaved(interpretation);
        setEditing(false);
      }}
    />
  );
}

function EditForm({
  view,
  latest,
  onSaved,
}: {
  view: SessionViewDto;
  latest: InterpretationDto | null;
  onSaved: (interpretation: InterpretationDto) => void;
}) {
  const queryClient = useQueryClient();
  const saved = latest;
  const initial: Answers = Object.fromEntries(
    view.questionSet.questions.map((q) => [q.id, saved?.answers.find((a) => a.questionId === q.id)?.text ?? ""]),
  );
  // 판마다 임시본을 따로 둔다. 고쳐 쓰다 말고 나가도 그 판 위의 고친 글이 남는다.
  const draft = useDraft<Answers>(`inkle:draft:session:${view.id}:v${saved?.version ?? 0}`, initial);
  const [problem, setProblem] = useState<string | null>(null);

  const save = useMutation({
    ...api.sessions.saveInterpretation.mutationOptions(),
    onSuccess: async (interpretation) => {
      draft.clear();
      onSaved(interpretation);
      await queryClient.invalidateQueries({ queryKey: api.sessions.key() });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "INVALID_INTERPRETATION") {
        const parsed = invalidData.safeParse(error.data);
        if (parsed.success) return setProblem(parsed.data.violations.map(violationMessage).join(" · "));
      }
      setProblem("저장하지 못했어요. 쓴 글은 이 브라우저에 남아 있어요. 잠시 뒤 다시 시도해 주세요.");
    },
  });

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const answers = view.questionSet.questions
      .map((q) => ({ questionId: q.id, text: draft.value[q.id]?.trim() ?? "" }))
      .filter((a) => a.text);
    if (answers.length === 0) return setProblem("적어도 한 질문에 답해 주세요");
    const tooLong = answers.find((a) => chars(a.text) > ANSWER_MAX);
    if (tooLong) return setProblem(`${ANSWER_MAX}자까지 쓸 수 있어요`);
    setProblem(null);
    save.mutate({ sessionId: view.id, answers });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <p className="text-caption text-muted-foreground">
        내가 씀{draft.dirty ? " · 이 브라우저에 임시 저장됨" : ""}
      </p>
      {view.questionSet.questions.map((q) => {
        const id = `answer-${q.id}`;
        const text = draft.value[q.id] ?? "";
        return (
          <div key={q.id} className="flex flex-col gap-2">
            <label htmlFor={id} className="text-label">
              {q.text}
            </label>
            {q.hint && <p className="text-caption text-muted-foreground">{q.hint}</p>}
            <Textarea
              id={id}
              value={text}
              onChange={(e) => draft.setValue({ ...draft.value, [q.id]: e.target.value })}
              tone="me"
            />
            <p className="text-caption text-muted-foreground">{chars(text.trim())}자</p>
          </div>
        );
      })}
      <p className="text-body-sm text-muted-foreground">떠오르지 않는 질문은 비워 두어도 돼요.</p>
      {problem && (
        <p role="alert" className="text-body-sm text-destructive">
          {problem}
        </p>
      )}
      <div>
        <Button type="submit" disabled={save.isPending}>
          저장
        </Button>
      </div>
    </form>
  );
}
