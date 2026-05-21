# 남양주 왕숙2 A-3블록 공공분양주택 (A-3BL) 안내 사이트

공공분양주택 (LH) 입주자모집공고를 알기 쉽게 정리한 **정적 웹사이트**입니다.
서버 없이 GitHub Pages에서 그대로 동작합니다.

🔗 (배포 예정)

## 주요 기능

- **분양가 · 납부 계산기** — 타입/층/옵션 선택 시 총액과 회차별 납부 일정 자동 계산
- **청약자격 셀프체크** — 거주·세대·소득·자산 기반 예상 순위/특공 안내 (참고용)
- **청약 일정 & D-day** — 공고~당첨~서류~계약 타임라인
- **공고문 AI 검색 챗봇** — 51페이지 공고문에서 질문과 가장 관련된 **원문 조항**을 시맨틱 검색
  (브라우저에서 `transformers.js` + 사전 임베딩으로 동작, 서버 불필요)
- **자료실** — 공식 PDF 원문 + 주제별로 정리한 공고문 섹션(Markdown)

## 구조

```
index.html              메인 페이지
assets/css/style.css    디자인
assets/js/              main · calculator · eligibility · faq · chat(시맨틱 검색)
data/announcement.json  단지/일정/분양가/옵션/자격 구조화 데이터
data/chunks.json        RAG 청크(원문)
data/embeddings.json    사전 계산된 임베딩 벡터(384차원)
clauses/*.md            주제별 공고문 섹션
announcement.pdf        공식 입주자모집공고 전문
```

## 갱신 방법

이 사이트는 `cheongyak-site-builder` 스킬로 생성되었습니다.
공고문 PDF가 바뀌면 스킬의 빌드 파이프라인(`extract → chunk → embed`)을 다시 실행해
`data/`와 `clauses/`를 재생성하면 됩니다.

> ⚠️ 본 사이트는 공고를 정리한 **비공식 안내 페이지**입니다. 모든 청약 자격·금액·일정의
> 법적 기준은 공식 입주자모집공고문과 [청약홈](https://www.applyhome.co.kr)을 따릅니다.
