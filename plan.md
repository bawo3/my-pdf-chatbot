# Plan: 취업규칙 PDF 챗봇

## 1. 프로젝트 목표

취업규칙 PDF 문서를 AI가 읽고, 직원이 자유롭게 질문하면 관련 규정을 쉽고 정확하게 안내해 주는 챗봇 서비스를 만든다.

---

## 2. 기능 요구사항 (Functional Requirements)

| 번호 | 기능 | 우선순위 |
|------|------|----------|
| F-01 | 사용자가 질문을 입력하면 AI가 취업규칙 기반으로 답변한다 | 필수 |
| F-02 | 플로팅 버튼으로 챗봇 팝업을 열고 닫을 수 있다 | 필수 |
| F-03 | 타이핑 인디케이터(로딩 점)를 보여주며 응답 대기 상태를 알린다 | 필수 |
| F-04 | Enter 키로 전송, Shift+Enter로 줄바꿈을 지원한다 | 필수 |
| F-05 | PDF 파일을 서버에서 파싱하여 텍스트를 추출한다 | 필수 |
| F-06 | 추출한 텍스트를 컨텍스트로 OpenAI API에 전달한다 | 필수 |
| F-07 | 서버 오류 시 사용자에게 친절한 오류 메시지를 보여준다 | 권장 |
| F-08 | 모바일 화면(480px 이하)에서도 챗봇이 정상 동작한다 | 권장 |

---

## 3. 비기능 요구사항 (Non-Functional Requirements)

- **보안**: API 키는 서버에서만 관리, 프론트엔드에 노출 금지
- **응답 속도**: 일반적인 질문에 5초 이내 응답
- **배포**: Vercel 서버리스 환경에서 동작
- **유지보수**: PDF 파일 교체만으로 다른 문서에도 활용 가능

---

## 4. 기술 스택

| 영역 | 기술 | 선택 이유 |
|------|------|-----------|
| 프론트엔드 | HTML + CSS + Vanilla JS | 별도 빌드 없이 Vercel에서 정적 파일 서비스 가능 |
| 백엔드 | Node.js + Express | 가볍고 Vercel 서버리스와 호환 |
| AI | OpenAI gpt-4o-mini | 비용 효율적이고 한국어 응답 품질 우수 |
| PDF 파싱 | pdf-parse | Node.js 환경에서 가장 널리 쓰이는 PDF 텍스트 추출 라이브러리 |
| 배포 | Vercel | 무료 플랜에서 Express 서버리스 함수 지원 |

---

## 5. 개발 단계 (마일스톤)

### Phase 1 — 백엔드 구현 (현재 단계)
- [ ] `npm init` 및 의존성 설치 (`express`, `pdf-parse`, `openai`, `dotenv`, `cors`)
- [ ] `server.js` 작성: PDF 파싱 + OpenAI API 호출
- [ ] `POST /api/chat` 엔드포인트 구현
- [ ] `.env` 파일에 `OPENAI_API_KEY` 설정
- [ ] 로컬에서 `node server.js`로 동작 확인

### Phase 2 — 프론트엔드 연동
- [x] `public/index.html` 챗봇 UI 구현 완료
- [ ] `fetch('/api/chat')` 호출 후 응답 표시 확인
- [ ] 오류 상황(서버 다운, API 오류) 처리 테스트

### Phase 3 — Vercel 배포
- [ ] `vercel.json` 작성 (라우팅 설정)
- [ ] Vercel 환경변수에 `OPENAI_API_KEY` 등록
- [ ] `vercel deploy`로 배포
- [ ] 실제 URL에서 전체 기능 검증

---

## 6. 파일 구조 계획

```
my-pdf-chatbot/
├── docs/
│   └── LS ITC 취업규칙.pdf     # PDF 원본 (서버에서 읽기 전용)
├── public/
│   └── index.html              # 챗봇 UI (정적 파일)
├── server.js                   # Express 서버 (API 처리)
├── vercel.json                 # Vercel 배포 설정
├── package.json
├── .env                        # API 키 (Git 제외)
├── .gitignore
└── CLAUDE.md
```

---

## 7. 위험 요소 및 대응

| 위험 요소 | 대응 방안 |
|-----------|-----------|
| PDF 파일 크기가 커서 매 요청마다 파싱 시간이 걸림 | 서버 시작 시 1회만 파싱하고 메모리에 캐시 |
| OpenAI 컨텍스트 길이 초과 | PDF 텍스트를 일정 길이로 잘라서 전달 |
| API 키 노출 | `.gitignore`와 환경변수로 관리 |
| Vercel 무료 플랜 함수 실행 시간 제한(10초) | gpt-4o-mini 사용으로 응답 속도 확보 |
