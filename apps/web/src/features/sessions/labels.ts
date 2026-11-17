import type { InterpretationViolationDto, SessionStageDto } from "@inkle/contract/sessions";

export const STAGE_LABEL: Record<SessionStageDto, string> = {
  writing: "쓰는 중",
  interpretation_saved: "내 해석 저장함",
};

export function violationMessage(v: InterpretationViolationDto): string {
  switch (v.reason) {
    case "no_answer":
      return "적어도 한 질문에 답해 주세요";
    case "too_long":
      return `${v.max ?? 4000}자까지 쓸 수 있어요`;
    default:
      return "질문이 바뀌었어요. 화면을 새로 고쳐 주세요";
  }
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
