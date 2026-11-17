#!/usr/bin/env bash
# ADR-004 가정 1~3 확인. 일회성 스크립트.
# 호스트(로그인된 CLI): bash scripts/spike/cli-check.sh
# 컨테이너(토큰 필요): docker run --rm --env-file .env inkle-dev bash scripts/spike/cli-check.sh
set -uo pipefail

if [ -z "${CLAUDE_CODE_OAUTH_TOKEN:-}" ]; then
  echo "CLAUDE_CODE_OAUTH_TOKEN 없음: 이 기기에 로그인된 CLI 를 쓴다 (호스트 실행)."
fi
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ANTHROPIC_API_KEY 가 설정되어 있으면 구독 토큰보다 우선한다. 지운 뒤 다시 실행한다." >&2
  exit 2
fi

# CLI 는 프로젝트 설정이 없는 빈 디렉토리에서 실행한다 (ADR-004 §1).
WORKDIR_LLM="${LLM_WORKDIR:-$(mktemp -d)}"
cd "$WORKDIR_LLM"
claude --version

echo "== 가정 1: 토큰으로 비대화 실행 =="
claude -p "한 낱말로만 답하라: 준비됨" --tools "" --output-format json --max-turns 1 < /dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(JSON.stringify({result:j.result,cost:j.total_cost_usd,keys:Object.keys(j)}))})'
echo "exit=$?"

echo "== 가정 2: 웹 검색만 켜고 주소 받기 =="
SCHEMA_SEARCH='{"type":"object","properties":{"results":{"type":"array","items":{"type":"object","properties":{"url":{"type":"string"},"who":{"type":"string"},"about":{"type":"string"}},"required":["url","who","about"]}}},"required":["results"]}'
claude -p "헤밍웨이의 『노인과 바다』에 대한 평론이나 작가 인터뷰를 웹에서 검색해 3개를 찾아라. 검색 결과에 실제로 나온 주소만 적는다." \
  --tools "WebSearch" --allowedTools "WebSearch" --output-format json --json-schema "$SCHEMA_SEARCH" --max-turns 6 < /dev/null \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(JSON.stringify({structured:j.structured_output,cost:j.total_cost_usd,turns:j.num_turns},null,1))})'
echo "exit=$?"

echo "== 가정 3: 한국어가 섞인 결과에서 형식 지키기 (3회) =="
SCHEMA_ITEMS='{"type":"object","properties":{"items":{"type":"array","minItems":3,"items":{"type":"object","properties":{"claim_ko":{"type":"string"},"quote":{"type":"string"},"kind":{"type":"string","enum":["direct","editor","requote"]}},"required":["claim_ko","quote","kind"]}}},"required":["items"]}'
TEXT='Hemingway told a reporter in 1954: "There isn'"'"'t any symbolism. The sea is the sea. The old man is an old man." The critic wrote that the novella is often read as a parable of defeat. 한 독자는 "늙은 어부의 패배가 아니라 버팀을 그린 책"이라고 적었다.'
for i in 1 2 3; do
  claude -p "아래 글에서 주장 3개를 뽑아라. quote 는 글에 있는 문장을 한 글자도 바꾸지 않고 그대로 옮긴다. claim_ko 는 한국어로 쓴다.

$TEXT" --tools "" --output-format json --json-schema "$SCHEMA_ITEMS" --max-turns 2 < /dev/null \
    | TEXT="$TEXT" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const o=j.structured_output;if(!o){console.log("structured_output 없음");return}const t=process.env.TEXT;console.log(JSON.stringify({count:o.items.length,kinds:o.items.map(x=>x.kind),quotesFoundInText:o.items.filter(x=>t.includes(x.quote)).length,cost:j.total_cost_usd}))})'
done
