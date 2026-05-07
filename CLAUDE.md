# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

취업규칙 PDF 문서를 기반으로 사용자 질문에 답변하는 챗봇. Node.js + Express 서버가 PDF를 파싱하고 OpenAI API(`gpt-4o-mini`)로 답변을 생성하며, Vercel에 배포된다.

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (로컬)
node server.js

# 또는 nodemon으로 자동 재시작
npx nodemon server.js
```

## 아키텍처

```
my-pdf-chatbot/
├── docs/         # PDF 원본 파일 보관 (취업규칙 PDF 등)
├── public/       # 프론트엔드 정적 파일 (HTML, CSS, JS)
└── server.js     # Express 서버 — PDF 파싱 + OpenAI API 호출 처리
```

**요청 흐름:**
1. 사용자가 `public/`의 HTML 페이지에서 질문 입력
2. 브라우저가 `POST /api/chat` 으로 질문 전송
3. `server.js`가 `docs/`의 PDF를 파싱해 텍스트 추출
4. 추출된 텍스트 + 질문을 `gpt-4o-mini`에 전달
5. 응답을 클라이언트에 반환

## 보안 규칙

- `.env` 파일은 Git에 커밋하지 않는다 (`.gitignore`에 이미 포함됨).
- `OPENAI_API_KEY`는 `server.js`에서만 `process.env.OPENAI_API_KEY`로 참조한다.
- 프론트엔드(`public/`) 코드에 API 키를 절대 포함하지 않는다.

## 환경 변수 (.env)

```
OPENAI_API_KEY=sk-...
PORT=3000
```

## 코딩 규칙

- 모든 주석은 한국어로 작성한다.
- 모든 설명과 답변은 초보자도 이해할 수 있는 쉬운 한국어로 작성한다.
