// 환경변수 로드 (.env 파일의 OPENAI_API_KEY 등을 process.env로 사용 가능하게 함)
require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');
const OpenAI  = require('openai');

const app  = express();
const PORT = process.env.PORT || 3000;

// JSON 요청 본문 파싱 허용
app.use(express.json());
// 다른 출처(도메인)에서의 요청 허용 (개발 편의용)
app.use(cors());
// public/ 폴더의 HTML, CSS, JS 파일을 정적으로 서비스
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI 클라이언트 초기화
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// PDF 텍스트를 서버 시작 시 한 번만 읽어 메모리에 저장
let pdfText = '';

async function initPdfText() {
  const docsDir = path.join(__dirname, 'docs');

  if (!fs.existsSync(docsDir)) {
    console.warn('[경고] docs/ 폴더가 없습니다.');
    return;
  }

  // docs/ 폴더 안의 txt 파일 목록 수집
  const txtFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt'));

  if (txtFiles.length === 0) {
    console.warn('[경고] docs/ 폴더에 txt 파일이 없습니다.');
    return;
  }

  const texts = [];
  for (const file of txtFiles) {
    const filePath = path.join(docsDir, file);
    const text     = fs.readFileSync(filePath, 'utf-8');
    texts.push(text);
    console.log(`[TXT 로드] ${file} (${text.length}자)`);
  }

  pdfText = texts.join('\n\n');
  console.log(`[완료] 총 ${pdfText.length}자 로드됨`);
}

// POST /api/chat — 사용자 질문을 받아 AI 답변을 반환
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  // 빈 메시지 거부
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: '질문을 입력해 주세요.' });
  }

  // PDF가 아직 로드되지 않은 경우 안내
  if (!pdfText) {
    return res.status(503).json({ error: '취업규칙 문서를 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' });
  }

  try {
    // gpt-4o-mini는 컨텍스트가 넉넉하므로 최대 20000자까지 사용
    const context = pdfText.slice(0, 20000);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '당신은 LS ITC 회사의 취업규칙 전문 상담 AI입니다.\n' +
            '아래 취업규칙 문서 내용을 바탕으로 직원의 질문에 정확하고 친절하게 답변해 주세요.\n\n' +
            '답변 규칙:\n' +
            '1. 반드시 아래 취업규칙 문서 내용을 근거로 답변하세요.\n' +
            '2. 문서에 해당 내용이 없으면 "취업규칙에 해당 내용이 명시되어 있지 않습니다. 인사총무팀에 문의해 주세요."라고 안내하세요.\n' +
            '3. 답변은 아래 형식을 따라 작성하세요:\n' +
            '   - 핵심 답변을 첫 줄에 간결하게 작성하세요.\n' +
            '   - 세부 내용이 있으면 줄바꿈 후 "• 항목" 형식으로 나열하세요.\n' +
            '   - 관련 조항이 있으면 마지막에 "(근거: 제00조)" 형식으로 표기하세요.\n' +
            '4. 어렵거나 딱딱한 표현 대신 쉽고 친근한 한국어로 작성하세요.\n' +
            '5. 불필요하게 길게 쓰지 말고 핵심만 간결하게 답변하세요.\n\n' +
            '[취업규칙 내용]\n' +
            context,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 800,
      temperature: 0.3, // 낮을수록 일관되고 사실적인 답변
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error('[OpenAI 오류]', err.message);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`\n서버 시작: http://localhost:${PORT}`);
  await initPdfText();
});
