export interface IndicatorOption {
  label: string;
  score: number;
}

export interface IndicatorDef {
  key: string;
  code: string;
  name: string;
  options: IndicatorOption[];
}

export interface IndicatorGroup {
  id: 'A' | 'B' | 'C';
  label: string;
  indicators: IndicatorDef[];
}

const none: IndicatorOption = { label: '— не задано (0) —', score: 0 };

export const INDICATOR_GROUPS: IndicatorGroup[] = [
  {
    id: 'A',
    label: 'Экономические показатели',
    indicators: [
      {
        key: 'k1', code: 'K1', name: 'Средний доход за 2 года',
        options: [none,
          { label: 'Более 100 тыс. сомони (4)', score: 4 },
          { label: 'Более 1 млн сомони (8)', score: 8 },
          { label: 'Более 10 млн сомони (10)', score: 10 },
        ],
      },
      {
        key: 'k2', code: 'K2', name: 'Средняя стоимость договора аудита',
        options: [none,
          { label: 'До 50 тыс. сомони (4)', score: 4 },
          { label: '50–100 тыс. сомони (8)', score: 8 },
          { label: 'Более 100 тыс. сомони (10)', score: 10 },
        ],
      },
      {
        key: 'k3', code: 'K3', name: 'Средняя прибыль за 2 года',
        options: [none,
          { label: 'Более 30 тыс. сомони (4)', score: 4 },
          { label: 'Более 300 тыс. сомони (8)', score: 8 },
          { label: 'Более 3 млн сомони (10)', score: 10 },
        ],
      },
      {
        key: 'k4', code: 'K4', name: 'Прибыльность продаж, ROS = P/В',
        options: [none,
          { label: 'ROS от 0.2 до 0.4 (5)', score: 5 },
          { label: 'ROS от 0.4 до 0.7 (8)', score: 8 },
          { label: 'ROS от 0.7 до 1.0 (10)', score: 10 },
        ],
      },
      {
        key: 'k5', code: 'K5', name: 'Рост дохода к пред. периоду',
        options: [none,
          { label: '0–10% роста (2)', score: 2 },
          { label: '10–30% роста (5)', score: 5 },
          { label: '30–50% роста (8)', score: 8 },
          { label: '50–100% роста (10)', score: 10 },
        ],
      },
      {
        key: 'k6', code: 'K6', name: 'Доход на одного специалиста за 2 года',
        options: [none,
          { label: 'Более 3 тыс. сомони (4)', score: 4 },
          { label: 'Более 30 тыс. сомони (8)', score: 8 },
          { label: 'Более 300 тыс. сомони (10)', score: 10 },
        ],
      },
    ],
  },
  {
    id: 'B',
    label: 'Уровень профессионализма',
    indicators: [
      {
        key: 'k7', code: 'K7', name: 'Аудиторов с квалиф. аттестатом',
        options: [none,
          { label: '2 аудитора (4)', score: 4 },
          { label: '3–5 аудиторов (6)', score: 6 },
          { label: 'Более 5 аудиторов (10)', score: 10 },
        ],
      },
      {
        key: 'k8', code: 'K8', name: 'Численность работников (штат)',
        options: [none,
          { label: '2 работника (4)', score: 4 },
          { label: '3–5 работников (6)', score: 6 },
          { label: '6–10 работников (8)', score: 8 },
          { label: 'Более 10 работников (10)', score: 10 },
        ],
      },
      {
        key: 'k9', code: 'K9', name: 'Средний стаж аудиторов',
        options: [none,
          { label: 'Менее 1 года (2)', score: 2 },
          { label: '1–3 года (4)', score: 4 },
          { label: '4–6 лет (6)', score: 6 },
          { label: '7–10 лет (8)', score: 8 },
          { label: 'Более 10 лет (10)', score: 10 },
        ],
      },
      {
        key: 'k10', code: 'K10', name: 'Спец. программы и методики аудита',
        options: [none,
          { label: '1–3 года применения (4)', score: 4 },
          { label: '4–6 лет применения (6)', score: 6 },
          { label: 'Более 6 лет (10)', score: 10 },
        ],
      },
      {
        key: 'k11', code: 'K11', name: 'Внутр. система контроля качества',
        options: [none,
          { label: '1–3 года работы (5)', score: 5 },
          { label: 'Более 3 лет (10)', score: 10 },
        ],
      },
      {
        key: 'k12', code: 'K12', name: 'Проведение аудита',
        options: [none,
          { label: 'Только инициативный аудит (5)', score: 5 },
          { label: 'Обязательный и инициативный (10)', score: 10 },
        ],
      },
      {
        key: 'k13', code: 'K13', name: 'Повышение квалификации за 2 года',
        options: [none,
          { label: 'Прошли частично (5)', score: 5 },
          { label: 'Прошли полностью (10)', score: 10 },
        ],
      },
      {
        key: 'k14', code: 'K14', name: 'Виды сопутствующих аудит. услуг',
        options: [none,
          { label: '1 вид (2.5)', score: 2.5 },
          { label: '2 вида (5)', score: 5 },
          { label: '3 вида (7.5)', score: 7.5 },
          { label: '4 и более видов (10)', score: 10 },
        ],
      },
      {
        key: 'k15', code: 'K15', name: 'Другие виды услуг',
        options: [none,
          { label: '1 вид (1)', score: 1 },
          { label: '2 вида (2)', score: 2 },
          { label: '3 вида (3)', score: 3 },
          { label: '4 вида (4)', score: 4 },
          { label: '5 видов (5)', score: 5 },
          { label: '6 видов (6)', score: 6 },
          { label: '7 видов (7)', score: 7 },
          { label: '8 видов (8)', score: 8 },
          { label: '9 видов (9)', score: 9 },
          { label: '10 и более видов (10)', score: 10 },
        ],
      },
      {
        key: 'k16', code: 'K16', name: 'Применение МСА',
        options: [none,
          { label: 'Действующие МСА (10)', score: 10 },
        ],
      },
      {
        key: 'k17', code: 'K17', name: 'Предупреждения (несоблюд. МСА)',
        options: [none,
          { label: 'Отсутствуют (10)', score: 10 },
        ],
      },
      {
        key: 'k18', code: 'K18', name: 'Санкции (штрафы)',
        options: [none,
          { label: 'Отсутствуют (10)', score: 10 },
        ],
      },
      {
        key: 'k19', code: 'K19', name: 'Аудиторы с межд. сертификатами (ACCA/CPA/CFA/DipIFR)',
        options: [none,
          { label: '1–3 аудитора (6)', score: 6 },
          { label: '3–5 аудиторов (8)', score: 8 },
          { label: 'Более 5 аудиторов (10)', score: 10 },
        ],
      },
      {
        key: 'k20', code: 'K20', name: 'Аудиторы с сертификатом CIPA',
        options: [none,
          { label: '1–3 аудитора (6)', score: 6 },
          { label: '3–5 аудиторов (8)', score: 8 },
          { label: 'Более 5 аудиторов (10)', score: 10 },
        ],
      },
      {
        key: 'k21', code: 'K21', name: 'Расходы на обучение / операц. расходы',
        options: [none,
          { label: '0–10% (2)', score: 2 },
          { label: '10–25% (4)', score: 4 },
          { label: '25–40% (7)', score: 7 },
          { label: 'Более 40% (10)', score: 10 },
        ],
      },
    ],
  },
  {
    id: 'C',
    label: 'Деловая репутация',
    indicators: [
      {
        key: 'k22', code: 'K22', name: 'Срок деятельности с даты регистрации',
        options: [none,
          { label: '1–2 года (4)', score: 4 },
          { label: '3–5 лет (6)', score: 6 },
          { label: '6–10 лет (8)', score: 8 },
          { label: 'Более 10 лет (10)', score: 10 },
        ],
      },
      {
        key: 'k23', code: 'K23', name: 'Разнообразие клиентов (виды деят.)',
        options: [none,
          { label: '1 вид деятельности (3)', score: 3 },
          { label: '2–3 вида (5)', score: 5 },
          { label: '4–5 видов (7)', score: 7 },
          { label: 'Более 6 видов (10)', score: 10 },
        ],
      },
      {
        key: 'k24', code: 'K24', name: 'Членство в ассоциации аудиторов',
        options: [none,
          { label: 'Является членом (10)', score: 10 },
        ],
      },
      {
        key: 'k25', code: 'K25', name: 'Аккредитации международных организаций',
        options: [none,
          { label: '1 аккредитация (5)', score: 5 },
          { label: 'Более 1 аккредитации (10)', score: 10 },
        ],
      },
    ],
  },
];
