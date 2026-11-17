# 웹 앱과 작업 프로세스가 함께 쓰는 이미지 (ADR-001). 개발용이다.
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

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

EXPOSE 3000
CMD ["pnpm", "dev"]
