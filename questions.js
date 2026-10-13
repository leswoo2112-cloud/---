"use strict";

/*
 * 한국사 퀴즈쇼 — questions.js
 *
 * 구성
 * 1. 교재 및 게임 정보
 * 2. 대단원
 * 3. 세부 단원
 * 4. 참고 출처
 * 5. 문제 데이터
 *
 * 정답 번호 answer는 0부터 시작합니다.
 * 첫 번째 보기 = 0
 * 두 번째 보기 = 1
 * 세 번째 보기 = 2
 * 네 번째 보기 = 3
 *
 * 문제 유형
 * choice : 객관식
 * ox     : OX
 *
 * 이후 app.js는 window.QUIZ_DATA를 사용합니다.
 */

(() => {
  const chapters = [
    {
      id: "ch1",
      number: "Ⅰ",
      title: "일제 식민 통치와 민족 운동"
    },
    {
      id: "ch2",
      number: "Ⅱ",
      title: "대한민국의 발전"
    },
    {
      id: "ch3",
      number: "Ⅲ",
      title: "오늘날의 대한민국"
    }
  ];

  const units = [
    {
      id: "u01",
      chapterId: "ch1",
      number: 1,
      title: "제국주의 질서와 일제의 식민 통치 정책"
    },
    {
      id: "u02",
      chapterId: "ch1",
      number: 2,
      title: "경제 구조의 변화와 경제생활"
    },
    {
      id: "u03",
      chapterId: "ch1",
      number: 3,
      title: "민족 운동의 전개와 분화"
    },
    {
      id: "u04",
      chapterId: "ch1",
      number: 4,
      title: "사회·문화의 변화와 대중운동"
    },
    {
      id: "u05",
      chapterId: "ch1",
      number: 5,
      title: "독립 국가 건설 노력"
    },
    {
      id: "u06",
      chapterId: "ch2",
      number: 1,
      title: "냉전 체제와 대한민국 정부 수립"
    },
    {
      id: "u07",
      chapterId: "ch2",
      number: 2,
      title: "6·25 전쟁과 남북 분단의 고착화"
    },
    {
      id: "u08",
      chapterId: "ch2",
      number: 3,
      title: "민주화를 위한 노력"
    },
    {
      id: "u09",
      chapterId: "ch2",
      number: 4,
      title: "산업화의 성과와 사회·환경 문제"
    },
    {
      id: "u10",
      chapterId: "ch2",
      number: 5,
      title: "문화 변동과 일상생활"
    },
    {
      id: "u11",
      chapterId: "ch3",
      number: 1,
      title: "6월 민주 항쟁 이후 민주화 과정"
    },
    {
      id: "u12",
      chapterId: "ch3",
      number: 2,
      title: "외환 위기의 극복과 사회·문화 변동"
    },
    {
      id: "u13",
      chapterId: "ch3",
      number: 3,
      title: "한반도 분단 극복과 동아시아의 평화를 위한 노력"
    }
  ];

  /*
   * 출처는 문제의 역사적 사실을 확인하는 자료입니다.
   * 교과서 페이지 번호나 교과서 수록 여부를 뜻하지 않습니다.
   */
  const sources = {
    colonialPolice: {
      organization: "국사편찬위원회 우리역사넷",
      title: "교과서 용어해설 — 헌병 경찰",
      url:
        "https://contents.history.go.kr/front/tg/view.do" +
        "?levelId=tg_004_1540"
    },

    ricePlan: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사연대기 — 산미증식계획",
      url:
        "https://contents.history.go.kr/mobile/kc/view.do" +
        "?levelId=kc_i402050"
    },

    singanhoe: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사연대기 — 신간회",
      url:
        "https://contents.history.go.kr/mobile/kc/view.do" +
        "?levelId=kc_o401900"
    },

    hyeongpyeong: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사연대기 — 형평 운동",
      url:
        "https://contents.history.go.kr/mobile/kc/view.do" +
        "?levelId=kc_o403500"
    },

    liberationArmy: {
      organization: "국사편찬위원회 우리역사넷",
      title: "사료로 본 한국사 — 한국광복군 선언문",
      url:
        "https://contents.history.go.kr/front/hm/view.do" +
        "?levelId=hm_127_0005"
    },

    liberationArmyPhoto: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사 이미지 자료 — 한국광복군 성립 전례식",
      url:
        "https://contents.history.go.kr/front/ki/printViewPopup.do" +
        "?levelId=ki_060_51100"
    },

    government: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사연대기 — 대한민국 정부 수립",
      url:
        "https://contents.history.go.kr/mobile/kc/view.do" +
        "?levelId=kc_i502100"
    },

    governmentElection: {
      organization: "국사편찬위원회 우리역사넷",
      title: "광복 후 대한민국 정부 수립",
      url:
        "https://contents.history.go.kr/mobile/eh/view.do" +
        "?levelId=eh_r0382_0010"
    },

    koreanWar: {
      organization: "국사편찬위원회 우리역사넷",
      title: "역대 국사교과서 — 6·25 전쟁",
      url:
        "https://contents.history.go.kr/front/ta/view.do" +
        "?levelId=ta_h71_0040_0050_0040_0030"
    },

    aprilRevolution: {
      organization: "국가기록원",
      title: "3·15 부정선거와 4·19 혁명 관련 기록",
      url:
        "https://theme.archives.go.kr/next/history/samilos/" +
        "sub2_2.do"
    },

    economicPlan: {
      organization: "국사편찬위원회 우리역사넷",
      title: "제1차 경제 개발 5개년 계획의 목표와 방침",
      url:
        "https://contents.history.go.kr/front/hm/view.do" +
        "?levelId=hm_155_0040"
    },

    separatedFamilies: {
      organization: "국사편찬위원회 우리역사넷",
      title: "한국사연대기 — 이산가족",
      url:
        "https://contents.history.go.kr/mobile/kc/view.do" +
        "?levelId=kc_i502900"
    },

    constitution1987: {
      organization: "국가기록원",
      title: "오늘의 기록 — 대통령 직선제 개헌안 국민투표",
      url:
        "https://theme.archives.go.kr/next/daily/viewMain.do" +
        "?selectDay=20121027"
    },

    juneDeclaration: {
      organization: "국사편찬위원회 우리역사넷",
      title: "사료로 본 한국사 — 6·29 민주화 선언",
      url:
        "https://contents.history.go.kr/front/hm/view.do" +
        "?levelId=hm_151_0050"
    },

    financialCrisis: {
      organization: "국가기록원",
      title: "국정분야 주제별 검색 — 외환위기(IMF구제금융)",
      url:
        "https://www.archives.go.kr/next/newsearch/" +
        "listSubjectDescription.do?id=006125&sitePage="
    },

    jointDeclaration: {
      organization: "국사편찬위원회 우리역사넷",
      title: "사료로 본 한국사 — 6·15 남북 공동 선언",
      url:
        "https://contents.history.go.kr/front/hm/view.do" +
        "?levelId=hm_153_0090"
    }
  };

  const questions = [
    /* =====================================
       Ⅰ-1. 일제의 식민 통치 정책
    ===================================== */

    {
      id: "q001",
      unitId: "u01",
      type: "choice",
      difficulty: "basic",

      question:
        "1910년대 일제의 무단 통치를 뒷받침한 " +
        "대표적인 경찰 제도는 무엇일까요?",

      options: [
        "헌병 경찰 제도",
        "주민 자치 경찰 제도",
        "독립운동 단체의 치안 제도",
        "지방 의회의 경찰 선출 제도"
      ],

      answer: 0,

      explanation:
        "일제는 헌병을 경찰 업무에 투입하여 " +
        "한국 사회를 강압적으로 통제했습니다. " +
        "헌병 경찰 제도는 1910년대 무단 통치의 " +
        "대표적인 특징입니다.",

      keyPoint: "1910년대 무단 통치 → 헌병 경찰",

      sourceIds: ["colonialPolice"]
    },

    {
      id: "q002",
      unitId: "u01",
      type: "ox",
      difficulty: "basic",

      question:
        "3·1 운동 이후 일제가 보통 경찰 제도로 바꾸면서 " +
        "한국에 대한 식민 지배도 끝났다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "3·1 운동 이후 일제는 헌병 경찰 제도를 " +
        "보통 경찰 제도로 바꾸었습니다. " +
        "그러나 이것이 식민 지배의 종료를 뜻하지는 않습니다. " +
        "통치 방식의 변화와 독립은 구별해야 합니다.",

      keyPoint: "경찰 제도의 변화 ≠ 식민 지배의 종료",

      sourceIds: ["colonialPolice"]
    },

    /* =====================================
       Ⅰ-2. 경제 구조와 경제생활
    ===================================== */

    {
      id: "q003",
      unitId: "u02",
      type: "choice",
      difficulty: "basic",

      question:
        "일제가 산미 증식 계획을 추진한 주요 목적은 무엇일까요?",

      options: [
        "한국 농민에게 토지를 균등하게 나누어 주기",
        "일본의 식량 부족 문제를 해결하기",
        "한국의 벼농사를 전면 금지하기",
        "한국의 소작제를 즉시 폐지하기"
      ],

      answer: 1,

      explanation:
        "일제는 조선에서 쌀 생산을 늘려 " +
        "일본의 식량 수요를 충당하려 했습니다. " +
        "산미 증식 계획은 식민지 조선의 농업을 " +
        "일본의 필요에 맞추어 재편한 정책입니다.",

      keyPoint: "산미 증식 계획 → 일본의 식량 수요 충당",

      sourceIds: ["ricePlan"]
    },

    {
      id: "q004",
      unitId: "u02",
      type: "ox",
      difficulty: "basic",

      question:
        "산미 증식 계획으로 일본에 반출되는 쌀이 늘면서 " +
        "한국인의 쌀 소비량은 오히려 줄어들었다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "쌀 생산이 증가하더라도 일본으로 반출되는 양이 " +
        "늘어나면 한국인의 식생활이 개선된다고 볼 수 없습니다. " +
        "산미 증식 계획 아래에서 한국인의 쌀 소비량은 감소했습니다.",

      keyPoint: "생산량 증가와 한국인의 생활 개선은 별개",

      sourceIds: ["ricePlan"]
    },

    /* =====================================
       Ⅰ-3. 민족 운동의 전개와 분화
    ===================================== */

    {
      id: "q005",
      unitId: "u03",
      type: "choice",
      difficulty: "basic",

      question:
        "1927년 민족주의 세력과 사회주의 세력이 " +
        "연합하여 결성한 단체는 무엇일까요?",

      options: [
        "독립협회",
        "대한 자강회",
        "신간회",
        "조선어 학회"
      ],

      answer: 2,

      explanation:
        "신간회는 1927년에 결성된 민족 운동 단체입니다. " +
        "민족주의 세력과 사회주의 세력이 " +
        "함께 참여했다는 점이 중요합니다.",

      keyPoint: "1927년 신간회 → 민족 협동 전선",

      sourceIds: ["singanhoe"]
    },

    {
      id: "q006",
      unitId: "u03",
      type: "ox",
      difficulty: "basic",

      question:
        "신간회는 민족주의 세력만 참여하고 " +
        "사회주의 세력은 참여하지 않은 단체였다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "신간회에는 민족주의 세력과 사회주의 세력이 " +
        "함께 참여했습니다. 서로 다른 사상적 배경을 지닌 " +
        "세력이 협력한 사례입니다.",

      keyPoint: "신간회에는 두 세력이 함께 참여",

      sourceIds: ["singanhoe"]
    },

    /* =====================================
       Ⅰ-4. 사회·문화와 대중운동
    ===================================== */

    {
      id: "q007",
      unitId: "u04",
      type: "choice",
      difficulty: "basic",

      question:
        "형평 운동이 해결하고자 한 대표적인 사회 문제는 무엇일까요?",

      options: [
        "대통령 간접 선거",
        "남북한의 군사적 대립",
        "외환 부족 문제",
        "백정에 대한 사회적 차별"
      ],

      answer: 3,

      explanation:
        "형평 운동은 백정에 대한 차별을 없애고 " +
        "평등한 대우를 실현하려 한 운동입니다. " +
        "1923년 창립된 형평사를 중심으로 전개되었습니다.",

      keyPoint: "형평 운동 → 차별 철폐와 평등 추구",

      sourceIds: ["hyeongpyeong"]
    },

    {
      id: "q008",
      unitId: "u04",
      type: "ox",
      difficulty: "basic",

      question:
        "형평사는 백정에 대한 차별을 없애고 " +
        "사회적 평등을 실현하려 했다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "형평사는 백정의 신분 해방과 평등한 사회를 " +
        "지향했습니다. 형평 운동은 일제 강점기 " +
        "사회적 차별에 맞선 운동의 하나입니다.",

      keyPoint: "형평사의 목표 → 평등한 대우",

      sourceIds: ["hyeongpyeong"]
    },

    /* =====================================
       Ⅰ-5. 독립 국가 건설 노력
    ===================================== */

    {
      id: "q009",
      unitId: "u05",
      type: "choice",
      difficulty: "basic",

      question:
        "1940년 대한민국 임시정부가 창설한 군대는 무엇일까요?",

      options: [
        "한국광복군",
        "별기군",
        "장용영",
        "훈련도감"
      ],

      answer: 0,

      explanation:
        "대한민국 임시정부는 1940년 중국 충칭에서 " +
        "한국광복군을 창설했습니다. 한국광복군은 " +
        "독립을 위한 무장 투쟁을 추진했습니다.",

      keyPoint: "1940년 · 충칭 · 한국광복군",

      sourceIds: [
        "liberationArmy",
        "liberationArmyPhoto"
      ]
    },

    {
      id: "q010",
      unitId: "u05",
      type: "ox",
      difficulty: "basic",

      question:
        "한국광복군은 대한민국 임시정부와 관련 없이 " +
        "조선 총독부가 창설한 군대였다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "한국광복군은 조선 총독부가 아니라 " +
        "대한민국 임시정부가 창설한 군대입니다. " +
        "식민 통치 기구와 독립운동 조직을 구별해야 합니다.",

      keyPoint: "한국광복군의 창설 주체 → 대한민국 임시정부",

      sourceIds: ["liberationArmy"]
    },

    /* =====================================
       Ⅱ-1. 대한민국 정부 수립
    ===================================== */

    {
      id: "q011",
      unitId: "u06",
      type: "choice",
      difficulty: "basic",

      question:
        "대한민국 정부 수립이 선포된 날은 언제일까요?",

      options: [
        "1919년 3월 1일",
        "1948년 8월 15일",
        "1950년 6월 25일",
        "1953년 7월 27일"
      ],

      answer: 1,

      explanation:
        "대한민국 정부 수립은 1948년 8월 15일에 " +
        "선포되었습니다. 1945년 8월 15일의 광복과 " +
        "1948년의 정부 수립을 구별해야 합니다.",

      keyPoint: "광복 1945년 / 대한민국 정부 수립 1948년",

      sourceIds: ["government"]
    },

    {
      id: "q012",
      unitId: "u06",
      type: "ox",
      difficulty: "basic",

      question:
        "1948년 5·10 총선거로 제헌 국회가 구성되었다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "5·10 총선거로 구성된 제헌 국회는 " +
        "헌법을 제정하고 대통령을 선출했습니다. " +
        "이후 대한민국 정부 수립이 선포되었습니다.",

      keyPoint: "5·10 총선거 → 제헌 국회 구성",

      sourceIds: ["governmentElection"]
    },

    /* =====================================
       Ⅱ-2. 6·25 전쟁과 분단
    ===================================== */

    {
      id: "q013",
      unitId: "u07",
      type: "choice",
      difficulty: "basic",

      question:
        "6·25 전쟁의 정전 협정이 체결된 해는 언제일까요?",

      options: [
        "1945년",
        "1950년",
        "1953년",
        "1960년"
      ],

      answer: 2,

      explanation:
        "1953년 7월 27일 정전 협정이 체결되었습니다. " +
        "정전은 전투를 멈추는 것으로, " +
        "평화 협정을 통한 전쟁의 종결과는 구별됩니다.",

      keyPoint: "1953년 7월 27일 → 정전 협정",

      sourceIds: ["koreanWar"]
    },

    {
      id: "q014",
      unitId: "u07",
      type: "ox",
      difficulty: "basic",

      question:
        "1953년 정전 협정이 체결되면서 " +
        "남북 분단이 해소되고 통일 정부가 수립되었다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "정전 협정 체결 이후에도 남북 분단은 이어졌습니다. " +
        "정전 협정 체결을 통일이나 분단 해소로 " +
        "이해해서는 안 됩니다.",

      keyPoint: "정전 이후에도 남북 분단 지속",

      sourceIds: ["koreanWar"]
    },

    /* =====================================
       Ⅱ-3. 민주화를 위한 노력
    ===================================== */

    {
      id: "q015",
      unitId: "u08",
      type: "choice",
      difficulty: "basic",

      question:
        "4·19 혁명의 주요 배경이 된 부정 선거는 무엇일까요?",

      options: [
        "1948년 5·10 총선거",
        "1987년 대통령 선거",
        "제헌 국회의 대통령 선거",
        "1960년 3·15 부정 선거"
      ],

      answer: 3,

      explanation:
        "1960년 3·15 부정 선거에 항의하는 시위가 " +
        "확산되면서 4·19 혁명으로 이어졌습니다. " +
        "학생과 시민은 부정 선거와 독재에 맞섰습니다.",

      keyPoint: "3·15 부정 선거 → 4·19 혁명의 배경",

      sourceIds: ["aprilRevolution"]
    },

    {
      id: "q016",
      unitId: "u08",
      type: "ox",
      difficulty: "basic",

      question:
        "4·19 혁명에는 부정 선거와 독재에 항의하는 " +
        "학생과 시민이 참여했다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "4·19 혁명은 학생과 시민이 참여한 민주화 운동입니다. " +
        "참여자들은 부정 선거를 규탄하고 " +
        "이승만 정권의 퇴진 등을 요구했습니다.",

      keyPoint: "4·19 혁명 → 학생과 시민의 민주화 요구",

      sourceIds: ["aprilRevolution"]
    },

    /* =====================================
       Ⅱ-4. 산업화
    ===================================== */

    {
      id: "q017",
      unitId: "u09",
      type: "choice",
      difficulty: "basic",

      question:
        "제1차 경제 개발 5개년 계획이 시작된 해는 언제일까요?",

      options: [
        "1962년",
        "1948년",
        "1953년",
        "1987년"
      ],

      answer: 0,

      explanation:
        "제1차 경제 개발 5개년 계획의 시행 기간은 " +
        "1962년부터 1966년까지입니다. " +
        "정부는 장기적인 계획을 통해 경제 개발을 추진했습니다.",

      keyPoint: "제1차 경제 개발 5개년 계획 → 1962~1966년",

      sourceIds: ["economicPlan"]
    },

    {
      id: "q018",
      unitId: "u09",
      type: "ox",
      difficulty: "basic",

      question:
        "제1차 경제 개발 5개년 계획은 " +
        "일제 강점기에 시작되었다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "제1차 경제 개발 5개년 계획은 1962년에 시작되었습니다. " +
        "일제 강점기의 경제 정책과 광복 이후 " +
        "대한민국의 경제 개발 정책을 구분해야 합니다.",

      keyPoint: "1962년은 광복 이후 대한민국 시기",

      sourceIds: ["economicPlan"]
    },

    /* =====================================
       Ⅱ-5. 문화 변동과 일상생활
    ===================================== */

    {
      id: "q019",
      unitId: "u10",
      type: "choice",
      difficulty: "basic",

      question:
        "1983년 「이산가족을 찾습니다」가 " +
        "전국에 전달된 주요 방송 매체는 무엇일까요?",

      options: [
        "스마트폰 앱",
        "텔레비전",
        "인터넷 동영상 플랫폼",
        "소셜 네트워크 서비스"
      ],

      answer: 1,

      explanation:
        "1983년 KBS는 텔레비전 특별 생방송으로 " +
        "「이산가족을 찾습니다」를 진행했습니다. " +
        "방송은 이산가족의 사연과 상봉 장면을 " +
        "사회에 널리 전달했습니다.",

      keyPoint: "1983년 이산가족 찾기 → 텔레비전 방송",

      sourceIds: ["separatedFamilies"]
    },

    {
      id: "q020",
      unitId: "u10",
      type: "ox",
      difficulty: "basic",

      question:
        "1983년 「이산가족을 찾습니다」 방송은 " +
        "분단과 전쟁으로 헤어진 가족들의 아픔을 널리 알렸다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "이산가족 찾기 방송은 가족을 찾는 사연과 " +
        "상봉 모습을 전국에 전했습니다. " +
        "대중 매체가 사회적 관심과 공감을 " +
        "확산시킨 사례로 살펴볼 수 있습니다.",

      keyPoint: "대중 매체 → 이산가족 문제에 대한 관심 확산",

      sourceIds: ["separatedFamilies"]
    },

    /* =====================================
       Ⅲ-1. 6월 민주 항쟁 이후 민주화
    ===================================== */

    {
      id: "q021",
      unitId: "u11",
      type: "choice",
      difficulty: "basic",

      question:
        "1987년 개헌으로 도입된 대통령 선출 방식은 무엇일까요?",

      options: [
        "왕위처럼 자녀에게 세습하는 방식",
        "추첨으로 대통령을 정하는 방식",
        "국민이 직접 투표하여 선출하는 방식",
        "외국 정부가 임명하는 방식"
      ],

      answer: 2,

      explanation:
        "1987년에는 대통령 직선제를 주요 내용으로 하는 " +
        "개헌이 이루어졌습니다. 대통령 직선제는 " +
        "국민이 직접 투표하여 대통령을 선출하는 제도입니다.",

      keyPoint: "1987년 개헌 → 대통령 직선제",

      sourceIds: [
        "constitution1987",
        "juneDeclaration"
      ]
    },

    {
      id: "q022",
      unitId: "u11",
      type: "ox",
      difficulty: "basic",

      question:
        "1987년 대통령 직선제 개헌안에 대해서는 " +
        "국민투표가 실시되지 않았다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "1987년 10월 27일 대통령 직선제 개헌안에 대한 " +
        "국민투표가 실시되었습니다. " +
        "국민투표를 거쳐 개헌이 확정되었습니다.",

      keyPoint: "1987년 10월 27일 → 개헌안 국민투표",

      sourceIds: ["constitution1987"]
    },

    /* =====================================
       Ⅲ-2. 외환 위기와 사회 변동
    ===================================== */

    {
      id: "q023",
      unitId: "u12",
      type: "choice",
      difficulty: "basic",

      question:
        "한국이 외환 위기 속에서 IMF의 금융 지원을 " +
        "받게 된 해는 언제일까요?",

      options: [
        "1962년",
        "1980년",
        "1987년",
        "1997년"
      ],

      answer: 3,

      explanation:
        "1997년 외환 부족과 금융 불안이 심화되면서 " +
        "한국은 국제통화기금인 IMF의 금융 지원을 받게 되었습니다. " +
        "이 시기의 경제 위기를 흔히 외환 위기라고 부릅니다.",

      keyPoint: "1997년 외환 위기 → IMF 금융 지원",

      sourceIds: ["financialCrisis"]
    },

    {
      id: "q024",
      unitId: "u12",
      type: "ox",
      difficulty: "basic",

      question:
        "1997년 외환 위기는 외환보유액 감소와 " +
        "외화 조달의 어려움 등과 관련이 있었다.",

      options: ["O", "X"],

      answer: 0,

      explanation:
        "외화 자금이 유출되고 해외에서 자금을 구하거나 " +
        "차입금의 만기를 연장하기 어려워지면서 " +
        "외환 위기가 심화되었습니다. " +
        "단순히 국내 물가 상승만으로 설명할 수는 없습니다.",

      keyPoint: "외화 부족과 금융 불안 → 외환 위기 심화",

      sourceIds: ["financialCrisis"]
    },

    /* =====================================
       Ⅲ-3. 분단 극복과 평화
    ===================================== */

    {
      id: "q025",
      unitId: "u13",
      type: "choice",
      difficulty: "basic",

      question:
        "2000년 첫 남북 정상 회담의 결과로 " +
        "발표된 선언은 무엇일까요?",

      options: [
        "6·15 남북 공동 선언",
        "3·1 독립 선언",
        "6·29 민주화 선언",
        "카이로 선언"
      ],

      answer: 0,

      explanation:
        "2000년 6월 김대중 대통령과 김정일 국방위원장은 " +
        "평양에서 남북 정상 회담을 했습니다. " +
        "회담의 결과로 6·15 남북 공동 선언이 발표되었습니다.",

      keyPoint: "2000년 첫 남북 정상 회담 → 6·15 공동 선언",

      sourceIds: ["jointDeclaration"]
    },

    {
      id: "q026",
      unitId: "u13",
      type: "ox",
      difficulty: "basic",

      question:
        "6·15 남북 공동 선언은 1987년 " +
        "6월 민주 항쟁의 결과로 발표되었다.",

      options: ["O", "X"],

      answer: 1,

      explanation:
        "6·15 남북 공동 선언은 2000년 남북 정상 회담의 " +
        "결과물입니다. 1987년의 민주화 과정과 관련된 " +
        "6·29 민주화 선언과 혼동하지 않아야 합니다.",

      keyPoint: "6·15는 남북 관계 / 6·29는 1987년 민주화",

      sourceIds: [
        "jointDeclaration",
        "juneDeclaration"
      ]
    }
  ];

  /*
   * 입력 실수를 조기에 찾기 위한 데이터 검사.
   * 문제를 추가할 때 ID, 단원, 정답, 출처를 확인합니다.
   */
  function validateData() {
    const chapterIds = new Set();
    const unitIds = new Set();
    const questionIds = new Set();

    for (const chapter of chapters) {
      if (!chapter.id || chapterIds.has(chapter.id)) {
        throw new Error(
          "대단원 ID가 없거나 중복되었습니다: " + chapter.id
        );
      }

      chapterIds.add(chapter.id);
    }

    for (const unit of units) {
      if (!unit.id || unitIds.has(unit.id)) {
        throw new Error(
          "세부 단원 ID가 없거나 중복되었습니다: " + unit.id
        );
      }

      if (!chapterIds.has(unit.chapterId)) {
        throw new Error(
          "세부 단원의 대단원 연결이 잘못되었습니다: " + unit.id
        );
      }

      unitIds.add(unit.id);
    }

    for (const question of questions) {
      if (!question.id || questionIds.has(question.id)) {
        throw new Error(
          "문제 ID가 없거나 중복되었습니다: " + question.id
        );
      }

      questionIds.add(question.id);

      if (!unitIds.has(question.unitId)) {
        throw new Error(
          "문제의 단원 연결이 잘못되었습니다: " + question.id
        );
      }

      if (!["choice", "ox"].includes(question.type)) {
        throw new Error(
          "지원하지 않는 문제 유형입니다: " + question.id
        );
      }

      if (
        typeof question.question !== "string" ||
        !question.question.trim()
      ) {
        throw new Error(
          "문제 내용이 비어 있습니다: " + question.id
        );
      }

      const requiredOptions =
        question.type === "ox" ? 2 : 4;

      if (
        !Array.isArray(question.options) ||
        question.options.length !== requiredOptions
      ) {
        throw new Error(
          "보기 개수가 잘못되었습니다: " + question.id
        );
      }

      if (
        question.options.some(
          option =>
            typeof option !== "string" ||
            !option.trim()
        )
      ) {
        throw new Error(
          "비어 있는 보기가 있습니다: " + question.id
        );
      }

      if (
        new Set(question.options).size !==
        question.options.length
      ) {
        throw new Error(
          "중복된 보기가 있습니다: " + question.id
        );
      }

      if (
        !Number.isInteger(question.answer) ||
        question.answer < 0 ||
        question.answer >= question.options.length
      ) {
        throw new Error(
          "정답 번호가 잘못되었습니다: " + question.id
        );
      }

      if (
        question.type === "ox" &&
        (
          question.options[0] !== "O" ||
          question.options[1] !== "X"
        )
      ) {
        throw new Error(
          "OX 보기 순서는 O, X여야 합니다: " + question.id
        );
      }

      if (
        typeof question.explanation !== "string" ||
        !question.explanation.trim()
      ) {
        throw new Error(
          "해설이 비어 있습니다: " + question.id
        );
      }

      if (
        !Array.isArray(question.sourceIds) ||
        question.sourceIds.length === 0
      ) {
        throw new Error(
          "참고 출처가 없습니다: " + question.id
        );
      }

      for (const sourceId of question.sourceIds) {
        const source = sources[sourceId];

        if (!source) {
          throw new Error(
            "등록되지 않은 출처입니다: " + sourceId
          );
        }

        if (!source.url.startsWith("https://")) {
          throw new Error(
            "출처 주소를 확인해 주세요: " + sourceId
          );
        }
      }
    }
  }

  validateData();

  /*
   * 원본 데이터가 실행 중 실수로 변경되지 않도록 보호합니다.
   * app.js에서는 필요한 데이터를 복사해서 사용합니다.
   */
  function deepFreeze(value) {
    if (
      value === null ||
      typeof value !== "object" ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  window.QUIZ_DATA = deepFreeze({
    version: "1.0.0",

    title: "한국사 퀴즈쇼",

    textbook: {
      name: "비상교육 고등학교 한국사 2",
      curriculum: "2022 개정",
      representativeAuthor: "도면회",
      contentsUrl:
        "https://v.vivasam.com/educourse/index.do" +
        "?lnbCode=106478&textbookCd=106478"
    },

    scopeNote:
      "공개 단원 체계에 맞춘 기초 26문항입니다. " +
      "교과서 전체 내용이나 모든 평가 요소를 포괄하지 않습니다.",

    sourceCheckedAt: "2026-10-13",

    chapters,
    units,
    sources,
    questions
  });
})();