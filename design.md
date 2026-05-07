# Design: 취업규칙 PDF 챗봇

## 1. 전체 아키텍처

```
브라우저 (public/index.html)
        │
        │  POST /api/chat  { message: "질문" }
        ▼
  Express 서버 (server.js)
        │
        ├─ 시작 시 1회: docs/*.pdf 파싱 → 텍스트 메모리 캐시
        │
        │  OpenAI API 호출
        │  { system: "취업규칙 전문가 역할 + PDF 텍스트", user: "질문" }
        ▼
  OpenAI gpt-4o-mini
        │
        │  { reply: "답변 텍스트" }
        ▼
  브라우저 → 챗봇 말풍선으로 표시
```

---

## 2. API 설계

### POST /api/chat

**요청 (Request)**
```json
{
  "message": "연차 휴가는 며칠인가요?"
}
```

**응답 성공 (200 OK)**
```json
{
  "reply": "취업규칙 제00조에 따르면 연차 유급휴가는 1년간 80% 이상 출근한 직원에게 15일이 부여됩니다..."
}
```

**응답 실패 (500 Internal Server Error)**
```json
{
  "error": "서버 오류가 발생했습니다."
}
```

---

## 3. 서버 모듈 설계 (server.js)

```
서버 시작 (app.listen)
    │
    └─ initPdfText()              ← PDF를 읽어 텍스트 추출, 전역 변수에 저장
           │
           └─ pdf-parse 라이브러리로 docs/ 폴더의 PDF 파일 파싱

요청 수신 POST /api/chat
    │
    ├─ req.body.message 유효성 검사 (빈 문자열 거부)
    │
    ├─ buildPrompt()              ← 시스템 프롬프트 구성
    │       └─ "당신은 취업규칙 전문가입니다. 아래 취업규칙 내용을 바탕으로..."
    │           + PDF 텍스트 (최대 8000자 잘라서 사용)
    │
    ├─ openai.chat.completions.create()  ← OpenAI API 호출
    │
    └─ res.json({ reply: ... })   ← 응답 반환
```

### 핵심 코드 구조

```javascript
// 서버 시작 시 PDF 텍스트 캐시
let pdfText = '';

async function initPdfText() {
  // docs/ 폴더의 PDF 파일 읽기
  // pdf-parse로 텍스트 추출
  // pdfText 변수에 저장
}

// POST /api/chat 핸들러
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  // 유효성 검사 → OpenAI 호출 → 응답 반환
});
```

---

## 4. 프론트엔드 컴포넌트 구조

```
index.html
├── <nav>                     네비게이션 바 (로고 + 태그)
├── <section class="hero">    히어로 섹션 (제목 + 설명 + CTA 버튼)
├── <div class="cards">       안내 카드 3개 (근로조건 / 복무규정 / 절차안내)
├── <button id="chat-fab">    플로팅 챗봇 버튼 (우측 하단 고정)
└── <div id="chatbox">        챗봇 팝업 창
        ├── .chat-header      헤더 (아이콘 + 이름 + 닫기 버튼)
        ├── #chat-messages    메시지 목록 (스크롤 가능)
        │       ├── .msg.bot  AI 말풍선
        │       └── .msg.user 사용자 말풍선
        └── .chat-footer      입력창 + 전송 버튼
```

### 프론트엔드 주요 함수

| 함수명 | 역할 |
|--------|------|
| `toggleChat()` | 챗봇 팝업 열기/닫기, FAB 아이콘 전환 |
| `openChat()` | 히어로 CTA 버튼에서 호출, 챗봇 열기만 담당 |
| `addMsg(role, text)` | 메시지 말풍선 DOM 생성 및 추가 |
| `addTyping()` | 타이핑 인디케이터(점 3개 애니메이션) 추가 |
| `sendMsg()` | 입력값 읽기 → API 호출 → 응답 표시 |

---

## 5. 디자인 시스템

### 색상 팔레트 (CSS 변수)

| 변수명 | 색상값 | 용도 |
|--------|--------|------|
| `--bg` | `#F4F1EA` | 페이지 배경 (따뜻한 크림색) |
| `--surface` | `#FDFAF4` | 카드, 챗봇 배경 |
| `--surface-user` | `#EDE5D8` | 사용자 말풍선 배경 |
| `--accent` | `#7A6A55` | 주요 버튼, 강조 색상 |
| `--accent-h` | `#6A5A48` | 버튼 hover 상태 |
| `--text` | `#2A2520` | 본문 텍스트 |
| `--muted` | `#8C8074` | 보조 텍스트, 레이블 |

### 폰트

- 제목: `Gowun Batang` (세리프, 고풍스럽고 신뢰감 있는 느낌)
- 본문: `Noto Sans KR` (고딕, 가독성 우수)

### 애니메이션

| 이름 | 대상 | 동작 |
|------|------|------|
| `fadeDown` | 네비게이션 | 위에서 아래로 등장 |
| `fadeUp` | 히어로, 카드 | 아래에서 위로 등장 (단계별 딜레이) |
| `bounce` | 타이핑 점 3개 | 위아래로 튀는 로딩 애니메이션 |
| CSS transition | 챗봇 팝업 | opacity + translateY + scale로 부드럽게 열림 |

---

## 6. Vercel 배포 설정 (vercel.json)

```json
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)",     "dest": "public/$1" }
  ]
}
```

- `/api/*` 경로는 `server.js` 서버리스 함수로 전달
- 그 외 경로는 `public/` 정적 파일로 서비스

---

## 7. 환경변수

| 변수명 | 값 형식 | 설명 |
|--------|---------|------|
| `OPENAI_API_KEY` | `sk-...` | OpenAI API 인증 키 |
| `PORT` | `3000` | 로컬 개발 서버 포트 (Vercel에서는 자동 설정) |

---

## 8. 시스템 프롬프트 전략

OpenAI에 전달하는 시스템 프롬프트 구성:

```
당신은 LS ITC 회사의 취업규칙 전문 상담 AI입니다.
아래 취업규칙 문서 내용을 바탕으로 직원의 질문에 정확하고 친절하게 답변해 주세요.

규칙:
1. 반드시 주어진 취업규칙 문서 내용을 근거로 답변하세요.
2. 문서에 없는 내용은 "취업규칙에서 해당 내용을 찾을 수 없습니다"라고 안내하세요.
3. 답변은 간결하고 이해하기 쉬운 한국어로 작성하세요.

[취업규칙 내용]
{PDF에서 추출한 텍스트 (최대 8000자)}
```
