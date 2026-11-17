# 개발용 이미지 하나를 web, api, worker 가 함께 쓴다 (ADR-010). 시작 명령만 다르다 (compose.yaml).
# 앱별 운영 이미지는 배포 방식을 정할 때 만든다.
FROM node:22-bookworm-slim

# Claude Code CLI 는 작업 프로세스가 LLM 을 부를 때 쓴다 (ADR-004). 판을 고정하고 자동 갱신을 끈다.
ARG CLAUDE_CODE_VERSION=2.1.326
ENV DISABLE_AUTOUPDATER=1

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g "@anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}" "pnpm@9.15.6"

# CLI 는 프로젝트 설정이 없는 빈 디렉토리에서 실행한다 (ADR-004 §1).
RUN mkdir -p /app /llm-workdir && chown node:node /app /llm-workdir
USER node
WORKDIR /app

# compose 가 .next 를 이름 없는 볼륨으로 덮는다. 이미지에 node 소유로 미리 만들어 두어야 볼륨도 같은 소유가 된다.
RUN mkdir -p /app/apps/web/.next

# 워크스페이스의 package.json 만 먼저 복사해 의존성 설치를 캐시한다.
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node apps/web/package.json apps/web/
COPY --chown=node:node apps/api/package.json apps/api/
COPY --chown=node:node apps/worker/package.json apps/worker/
COPY --chown=node:node packages/contract/package.json packages/contract/
COPY --chown=node:node packages/backend/package.json packages/backend/
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 3000 4000
CMD ["pnpm", "dev"]
