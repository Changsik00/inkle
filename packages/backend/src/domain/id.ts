const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 저장소가 만드는 번호(UUID) 모양인지. 모양이 틀린 번호로는 저장소를 부르지 않는다. */
export function isUuid(id: string): boolean {
  return UUID.test(id);
}
