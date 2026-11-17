// 호스트에서 실행할 때의 기본 주소. compose 의 db 가 이 기기 안쪽에만 여는 포트다.
// 컨테이너 안에서는 compose 가 DATABASE_URL 을 넣어 준다.
const LOCAL_DATABASE_URL = "postgres://inkle@127.0.0.1:54329/inkle";

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? LOCAL_DATABASE_URL;
}
