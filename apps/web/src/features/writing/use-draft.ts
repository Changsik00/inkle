"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

/**
 * 글쓰기 공통 훅 (ADR-007 §5).
 * - 쓰는 중인 글을 브라우저(localStorage)에 자동으로 임시 저장하고, 다시 열면 되살린다.
 * - 처음 값과 달라진 글이 있으면 창을 닫거나 새로고침할 때 묻는다 (beforeunload).
 * - 서버에 저장한 뒤에는 clear() 로 임시본을 지운다.
 * 서버 임시 저장은 하지 않는다. 서버에 남는 것은 저장 버튼으로 만든 판뿐이다 (ADR-005).
 *
 * 임시본은 localStorage 를 외부 저장소로 보고 useSyncExternalStore 로 읽는다.
 * 서버 렌더링에서는 임시본이 없는 것으로 그리고, 브라우저에서 이어받는다.
 * 처음 값과 같아지면 임시본을 지우므로 "임시본이 있다 = 바뀐 글이 있다"이다.
 */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function useDraft<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );
  const value = parse(raw, initial);
  const dirty = raw !== null;

  const setValue = useCallback(
    (next: T) => {
      if (JSON.stringify(next) === JSON.stringify(initial)) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify(next));
      notify();
    },
    [key, initial],
  );

  const clear = useCallback(() => {
    window.localStorage.removeItem(key);
    notify();
  }, [key]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return { value, setValue, dirty, clear };
}
