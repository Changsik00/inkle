import type { OtherPerspectiveDto, PrevalenceDto } from "@inkle/contract/perspectives";

export const ROLE_LABEL: Record<OtherPerspectiveDto["role"], string> = {
  critic: "평론가·기자",
  reader: "독자",
  other: "그 밖",
};

/** 흔한 정도 (ADR-002 §2). 알 수 없음은 표시하지 않는다 */
export const PREVALENCE_LABEL: Record<PrevalenceDto, string | null> = {
  majority: "많이 나온 읽기",
  some: "일부의 읽기",
  rare: "드문 읽기",
  unknown: null,
};
