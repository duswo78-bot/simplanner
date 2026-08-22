export type Category = '과일/채소' | '정육/수산' | '유제품/계란' | '간식/음료' | '생필품' | '기타';

export interface GroceryItem {
  id: string;
  name: string;
  category: Category;
  unit: string;
  price: number;
  icon: string;
  inspectDay?: string;
  storeName?: string;
  manufacturer?: string;
  imageUrl?: string;
  /** 참가격 API 상품 여부 */
  source?: 'api' | 'local' | 'custom';
  goodId?: string;
  /** 소분류 코드 (이미지 조회용, 내부) */
  smlcls?: string;
  /** 세일 여부 (goodDcYn) */
  isDiscount?: boolean;
  /** 1+1 여부 (plusoneYn) */
  isPlusOne?: boolean;
  discountStart?: string;
  discountEnd?: string;
  /** 지역 내 조사 매장 수 */
  storeCount?: number;
}

export interface RegionOption {
  code: string;
  name: string;
}

/** 지역 미선택(전국 샘플) */
export const REGION_ALL = 'ALL';

export const FALLBACK_REGIONS: RegionOption[] = [
  { code: '020000000', name: '서울특별시' },
  { code: '031000000', name: '경기도' },
  { code: '032000000', name: '인천광역시' },
  { code: '033000000', name: '강원도' },
  { code: '041000000', name: '충청남도' },
  { code: '042000000', name: '대전광역시' },
  { code: '043000000', name: '충청북도' },
  { code: '044000000', name: '세종특별자치시' },
  { code: '051000000', name: '부산광역시' },
  { code: '052000000', name: '울산광역시' },
  { code: '053000000', name: '대구광역시' },
  { code: '054000000', name: '경상북도' },
  { code: '055000000', name: '경상남도' },
  { code: '061000000', name: '전라남도' },
  { code: '062000000', name: '광주광역시' },
  { code: '063000000', name: '전라북도' },
  { code: '064000000', name: '제주특별자치도' }
];

export interface MealPreset {
  id: string;
  name: string;
  ingredients: string[];
}

export const KOREAN_MEAL_PRESETS: MealPreset[] = [
  { id: 'm1', name: '된장찌개', ingredients: ['된장', '두부', '애호박', '대파', '양파', '감자', '청양고추'] },
  { id: 'm2', name: '김치찌개', ingredients: ['김치', '돼지 삼겹살', '두부', '대파', '양파', '다진마늘'] },
  { id: 'm3', name: '미역국', ingredients: ['건미역', '소 국거리', '국간장', '참기름', '다진마늘'] },
  { id: 'm4', name: '소고기무국', ingredients: ['소 국거리', '무', '대파', '국간장', '다진마늘'] },
  { id: 'm5', name: '제육볶음', ingredients: ['돼지 앞다리살', '고추장', '고춧가루', '양파', '대파', '다진마늘'] },
  { id: 'm6', name: '불고기', ingredients: ['소 등심', '간장', '설탕', '양파', '대파', '다진마늘'] },
  { id: 'm7', name: '카레라이스', ingredients: ['카레가루', '돼지 앞다리살', '감자', '당근', '양파'] },
  { id: 'm8', name: '오므라이스', ingredients: ['계란', '즉석밥', '양파', '당근', '케첩'] },
  { id: 'm9', name: '김밥', ingredients: ['김', '즉석밥', '계란', '당근', '시금치', '단무지'] },
  { id: 'm10', name: '비빔밥', ingredients: ['즉석밥', '고추장', '참기름', '계란', '상추', '콩나물', '소 국거리'] },
  { id: 'm11', name: '볶음밥', ingredients: ['즉석밥', '계란', '대파', '양파', '당근'] },
  { id: 'm12', name: '계란말이', ingredients: ['계란', '대파', '당근', '소금'] },
  { id: 'm13', name: '닭볶음탕', ingredients: ['생닭 (볶음탕용)', '감자', '양파', '당근', '고추장', '고춧가루'] },
  { id: 'm14', name: '고등어조림', ingredients: ['고등어', '무', '양파', '대파', '고춧가루', '진간장'] },
  { id: 'm15', name: '갈치조림', ingredients: ['갈치', '무', '대파', '양파', '진간장'] },
  { id: 'm16', name: '수제비', ingredients: ['밀가루', '감자', '애호박', '대파', '국간장'] },
  { id: 'm17', name: '칼국수', ingredients: ['칼국수면', '애호박', '당근', '대파', '다진마늘'] },
  { id: 'm18', name: '잔치국수', ingredients: ['소면', '애호박', '당근', '계란', '김치', '진간장'] },
  { id: 'm19', name: '비빔국수', ingredients: ['소면', '고추장', '식초', '설탕', '오이', '계란'] },
  { id: 'm20', name: '떡볶이', ingredients: ['떡', '어묵', '고추장', '대파', '양파', '설탕'] },
  { id: 'm21', name: '오징어볶음', ingredients: ['오징어', '양파', '당근', '대파', '고추장'] },
  { id: 'm22', name: '감자채볶음', ingredients: ['감자', '양파', '당근', '소금'] },
  { id: 'm23', name: '두부조림', ingredients: ['두부', '양파', '대파', '진간장', '고춧가루'] },
  { id: 'm24', name: '시금치무침', ingredients: ['시금치', '다진마늘', '참기름', '소금'] },
  { id: 'm25', name: '콩나물국', ingredients: ['콩나물', '대파', '다진마늘', '국간장'] },
  { id: 'm26', name: '순두부찌개', ingredients: ['순두부', '바지락', '대파', '계란', '고춧가루'] },
  { id: 'm27', name: '스팸김치볶음밥', ingredients: ['스팸 통조림', '김치', '즉석밥', '계란', '참기름'] },
  { id: 'm28', name: '참치김치찌개', ingredients: ['참치 통조림', '김치', '두부', '양파', '대파'] },
  { id: 'm29', name: '짜장밥', ingredients: ['춘장', '돼지 앞다리살', '양파', '양배추', '감자', '즉석밥'] },
  { id: 'm30', name: '삼겹살 구이', ingredients: ['돼지 삼겹살', '상추', '깻잎', '쌈장', '다진마늘', '청양고추'] }
];

export const GROCERY_ITEMS: GroceryItem[] = [
  // === 식단 매칭용 추가 재료 ===
  { id: 'ex1', name: '두부', category: '기타', unit: '1모', price: 1500, icon: '🧊' },
  { id: 'ex2', name: '김치', category: '기타', unit: '1kg', price: 8000, icon: '🥬' },
  { id: 'ex3', name: '콩나물', category: '과일/채소', unit: '1봉', price: 1500, icon: '🌱' },
  { id: 'ex4', name: '순두부', category: '기타', unit: '1봉', price: 1000, icon: '🧊' },
  { id: 'ex5', name: '어묵', category: '정육/수산', unit: '1봉', price: 2500, icon: '🍢' },
  { id: 'ex6', name: '떡', category: '기타', unit: '1봉', price: 3000, icon: '🍡' },
  { id: 'ex7', name: '다진마늘', category: '과일/채소', unit: '1통', price: 5000, icon: '🧄' },
  { id: 'ex8', name: '단무지', category: '기타', unit: '1팩', price: 2000, icon: '🟡' },
  { id: 'ex9', name: '춘장', category: '기타', unit: '1팩', price: 2000, icon: '🟤' },
  { id: 'ex10', name: '국간장', category: '기타', unit: '1병', price: 5000, icon: '🏺' },
  { id: 'ex11', name: '식초', category: '기타', unit: '1병', price: 3000, icon: '🍶' },
  { id: 'ex12', name: '칼국수면', category: '기타', unit: '1봉', price: 2500, icon: '🍜' },

  // === 과일/채소 ===
  { id: 'f1', name: '사과', category: '과일/채소', unit: '1개', price: 1500, icon: '🍎', inspectDay: '2024-05-31', storeName: '이마트(성수점)' },
  { id: 'f2', name: '배', category: '과일/채소', unit: '1개', price: 3000, icon: '🍐', inspectDay: '2024-05-31', storeName: '홈플러스(강동점)' },
  { id: 'f3', name: '포도', category: '과일/채소', unit: '1송이', price: 5000, icon: '🍇' },
  { id: 'f4', name: '바나나', category: '과일/채소', unit: '1송이', price: 3900, icon: '🍌' },
  { id: 'f5', name: '귤', category: '과일/채소', unit: '1망(1kg)', price: 6000, icon: '🍊' },
  { id: 'f6', name: '오렌지', category: '과일/채소', unit: '1개', price: 1200, icon: '🍊' },
  { id: 'f7', name: '자몽', category: '과일/채소', unit: '1개', price: 1500, icon: '🍊' },
  { id: 'f8', name: '레몬', category: '과일/채소', unit: '1개', price: 1000, icon: '🍋' },
  { id: 'f9', name: '수박', category: '과일/채소', unit: '1통', price: 18000, icon: '🍉' },
  { id: 'f10', name: '멜론', category: '과일/채소', unit: '1통', price: 9000, icon: '🍈' },
  { id: 'f11', name: '참외', category: '과일/채소', unit: '3개', price: 5000, icon: '🍈' },
  { id: 'f12', name: '딸기', category: '과일/채소', unit: '1팩(500g)', price: 12000, icon: '🍓' },
  { id: 'f13', name: '블루베리', category: '과일/채소', unit: '1팩(200g)', price: 6000, icon: '🫐' },
  { id: 'f14', name: '키위', category: '과일/채소', unit: '1팩(5개)', price: 5500, icon: '🥝' },
  { id: 'f15', name: '파인애플', category: '과일/채소', unit: '1통', price: 6000, icon: '🍍' },
  { id: 'f16', name: '망고', category: '과일/채소', unit: '1개', price: 3500, icon: '🥭' },
  { id: 'f17', name: '복숭아', category: '과일/채소', unit: '1박스(2kg)', price: 15000, icon: '🍑' },
  { id: 'f18', name: '체리', category: '과일/채소', unit: '1팩(400g)', price: 8000, icon: '🍒' },
  { id: 'f19', name: '토마토', category: '과일/채소', unit: '1kg', price: 6000, icon: '🍅' },
  { id: 'f20', name: '방울토마토', category: '과일/채소', unit: '1팩(500g)', price: 4500, icon: '🍅' },
  { id: 'v1', name: '양파', category: '과일/채소', unit: '1망(1.5kg)', price: 4500, icon: '🧅' },
  { id: 'v2', name: '마늘', category: '과일/채소', unit: '1망(500g)', price: 6000, icon: '🧄' },
  { id: 'v3', name: '대파', category: '과일/채소', unit: '1단', price: 2500, icon: '🥬' },
  { id: 'v4', name: '쪽파', category: '과일/채소', unit: '1단', price: 3000, icon: '🥬' },
  { id: 'v5', name: '감자', category: '과일/채소', unit: '1kg', price: 3500, icon: '🥔' },
  { id: 'v6', name: '고구마', category: '과일/채소', unit: '1kg', price: 4000, icon: '🍠' },
  { id: 'v7', name: '당근', category: '과일/채소', unit: '1봉(3개)', price: 2500, icon: '🥕' },
  { id: 'v8', name: '무', category: '과일/채소', unit: '1개', price: 2000, icon: '🥬' },
  { id: 'v9', name: '배추', category: '과일/채소', unit: '1포기', price: 3500, icon: '🥬' },
  { id: 'v10', name: '양배추', category: '과일/채소', unit: '1통', price: 3000, icon: '🥬' },
  { id: 'v11', name: '상추', category: '과일/채소', unit: '1봉(200g)', price: 2000, icon: '🥬' },
  { id: 'v12', name: '깻잎', category: '과일/채소', unit: '5묶음', price: 1500, icon: '🍃' },
  { id: 'v13', name: '시금치', category: '과일/채소', unit: '1단', price: 2500, icon: '🥬' },
  { id: 'v14', name: '브로콜리', category: '과일/채소', unit: '1송이', price: 2000, icon: '🥦' },
  { id: 'v15', name: '파프리카', category: '과일/채소', unit: '2개', price: 3000, icon: '🫑' },
  { id: 'v16', name: '피망', category: '과일/채소', unit: '2개', price: 2500, icon: '🫑' },
  { id: 'v17', name: '오이', category: '과일/채소', unit: '3개', price: 2500, icon: '🥒' },
  { id: 'v18', name: '가지', category: '과일/채소', unit: '3개', price: 3000, icon: '🍆' },
  { id: 'v19', name: '애호박', category: '과일/채소', unit: '1개', price: 1500, icon: '🥒' },
  { id: 'v20', name: '양송이버섯', category: '과일/채소', unit: '1팩', price: 3500, icon: '🍄' },
  { id: 'v21', name: '팽이버섯', category: '과일/채소', unit: '3봉', price: 1500, icon: '🍄' },
  { id: 'v22', name: '표고버섯', category: '과일/채소', unit: '1팩', price: 4500, icon: '🍄' },
  { id: 'v23', name: '청양고추', category: '과일/채소', unit: '1봉', price: 2000, icon: '🌶️' },
  { id: 'v24', name: '아스파라거스', category: '과일/채소', unit: '1단', price: 5000, icon: '🥬' },
  { id: 'v25', name: '셀러리', category: '과일/채소', unit: '1단', price: 3500, icon: '🥬' },
  { id: 'v26', name: '옥수수', category: '과일/채소', unit: '3개', price: 4500, icon: '🌽' },

  // === 정육/수산 ===
  { id: 'm1', name: '돼지 삼겹살', category: '정육/수산', unit: '100g', price: 2800, icon: '🥓' },
  { id: 'm2', name: '돼지 목살', category: '정육/수산', unit: '100g', price: 2500, icon: '🥩' },
  { id: 'm3', name: '돼지 앞다리살', category: '정육/수산', unit: '100g', price: 1500, icon: '🥩' },
  { id: 'm4', name: '돼지 갈비', category: '정육/수산', unit: '100g', price: 2200, icon: '🍖' },
  { id: 'm5', name: '소 안심', category: '정육/수산', unit: '100g', price: 12000, icon: '🥩' },
  { id: 'm6', name: '소 등심', category: '정육/수산', unit: '100g', price: 10000, icon: '🥩' },
  { id: 'm7', name: '소 갈비', category: '정육/수산', unit: '100g', price: 8500, icon: '🍖' },
  { id: 'm8', name: '소 국거리', category: '정육/수산', unit: '100g', price: 5000, icon: '🥩' },
  { id: 'm9', name: '닭가슴살', category: '정육/수산', unit: '100g', price: 1200, icon: '🍗' },
  { id: 'm10', name: '생닭 (볶음탕용)', category: '정육/수산', unit: '1마리(1kg)', price: 8000, icon: '🐔' },
  { id: 'm11', name: '오리고기', category: '정육/수산', unit: '100g', price: 2600, icon: '🦆' },
  { id: 'm12', name: '양고기 (숄더랙)', category: '정육/수산', unit: '100g', price: 5000, icon: '🍖' },
  { id: 's1', name: '고등어', category: '정육/수산', unit: '2마리', price: 7000, icon: '🐟' },
  { id: 's2', name: '갈치', category: '정육/수산', unit: '1마리', price: 12000, icon: '🐟' },
  { id: 's3', name: '꽁치', category: '정육/수산', unit: '3마리', price: 5000, icon: '🐟' },
  { id: 's4', name: '생연어', category: '정육/수산', unit: '300g', price: 16000, icon: '🍣' },
  { id: 's5', name: '광어회', category: '정육/수산', unit: '1접시', price: 25000, icon: '🐠' },
  { id: 's6', name: '오징어', category: '정육/수산', unit: '2마리', price: 9000, icon: '🦑' },
  { id: 's7', name: '문어', category: '정육/수산', unit: '1마리', price: 25000, icon: '🐙' },
  { id: 's8', name: '낙지', category: '정육/수산', unit: '3마리', price: 12000, icon: '🐙' },
  { id: 's9', name: '새우', category: '정육/수산', unit: '1팩(20마리)', price: 15000, icon: '🦐' },
  { id: 's10', name: '꽃게', category: '정육/수산', unit: '1kg', price: 20000, icon: '🦀' },
  { id: 's11', name: '랍스터', category: '정육/수산', unit: '1마리', price: 35000, icon: '🦞' },
  { id: 's12', name: '전복', category: '정육/수산', unit: '5미', price: 15000, icon: '🦪' },
  { id: 's13', name: '굴', category: '정육/수산', unit: '1봉(250g)', price: 6000, icon: '🦪' },
  { id: 's14', name: '바지락', category: '정육/수산', unit: '1봉(500g)', price: 5000, icon: '🦪' },
  { id: 's15', name: '건미역', category: '정육/수산', unit: '1봉(100g)', price: 4000, icon: '🌿' },
  { id: 's16', name: '다시마', category: '정육/수산', unit: '1봉', price: 3500, icon: '🌿' },
  { id: 's17', name: '김', category: '정육/수산', unit: '100장', price: 8000, icon: '⬛' },
  { id: 's18', name: '멸치 (국물용)', category: '정육/수산', unit: '1박스(1.5kg)', price: 18000, icon: '🐟' },
  { id: 's19', name: '명란젓', category: '정육/수산', unit: '1팩(200g)', price: 12000, icon: '🥫' },

  // === 유제품/계란 ===
  { id: 'd1', name: '흰우유', category: '유제품/계란', unit: '1L', price: 2800, icon: '🥛' },
  { id: 'd2', name: '저지방우유', category: '유제품/계란', unit: '1L', price: 3000, icon: '🥛' },
  { id: 'd3', name: '초코우유', category: '유제품/계란', unit: '500ml', price: 1800, icon: '🧋' },
  { id: 'd4', name: '딸기우유', category: '유제품/계란', unit: '500ml', price: 1800, icon: '🧋' },
  { id: 'd5', name: '바나나우유', category: '유제품/계란', unit: '240ml 4개', price: 5500, icon: '🧋' },
  { id: 'd6', name: '두유', category: '유제품/계란', unit: '24입 1박스', price: 15000, icon: '🧃' },
  { id: 'd7', name: '아몬드우유', category: '유제품/계란', unit: '1L', price: 3500, icon: '🥛' },
  { id: 'd8', name: '플레인요거트', category: '유제품/계란', unit: '450g', price: 3500, icon: '🥣' },
  { id: 'd9', name: '딸기요거트', category: '유제품/계란', unit: '4입', price: 2800, icon: '🍓' },
  { id: 'd10', name: '그릭요거트', category: '유제품/계란', unit: '450g', price: 6000, icon: '🥣' },
  { id: 'd11', name: '마시는요거트', category: '유제품/계란', unit: '130ml 4개', price: 4000, icon: '🧃' },
  { id: 'd12', name: '슬라이스치즈', category: '유제품/계란', unit: '20매', price: 6500, icon: '🧀' },
  { id: 'd13', name: '모짜렐라치즈', category: '유제품/계란', unit: '300g', price: 7500, icon: '🧀' },
  { id: 'd14', name: '크림치즈', category: '유제품/계란', unit: '200g', price: 5000, icon: '🧀' },
  { id: 'd15', name: '파마산치즈가루', category: '유제품/계란', unit: '1통', price: 4500, icon: '🧀' },
  { id: 'd16', name: '버터', category: '유제품/계란', unit: '200g', price: 5500, icon: '🧈' },
  { id: 'd17', name: '가염버터', category: '유제품/계란', unit: '400g', price: 9000, icon: '🧈' },
  { id: 'd18', name: '마가린', category: '유제품/계란', unit: '400g', price: 3500, icon: '🧈' },
  { id: 'e1', name: '계란 (특란)', category: '유제품/계란', unit: '30구', price: 6500, icon: '🥚' },
  { id: 'e2', name: '왕란', category: '유제품/계란', unit: '15구', price: 5000, icon: '🥚' },
  { id: 'e3', name: '동물복지 유정란', category: '유제품/계란', unit: '15구', price: 7500, icon: '🥚' },
  { id: 'e4', name: '메추리알', category: '유제품/계란', unit: '1판', price: 3000, icon: '🥚' },
  { id: 'e5', name: '구운계란', category: '유제품/계란', unit: '30구', price: 9000, icon: '🥚' },
  { id: 'd19', name: '생크림', category: '유제품/계란', unit: '500ml', price: 4500, icon: '🧁' },
  { id: 'd20', name: '연유', category: '유제품/계란', unit: '1튜브', price: 3000, icon: '🍼' },

  // === 간식/음료 ===
  { id: 'b1', name: '콜라', category: '간식/음료', unit: '1.5L', price: 2500, icon: '🥤' },
  { id: 'b2', name: '사이다', category: '간식/음료', unit: '1.5L', price: 2400, icon: '🥤' },
  { id: 'b3', name: '환타 오렌지', category: '간식/음료', unit: '1.5L', price: 2400, icon: '🥤' },
  { id: 'b4', name: '탄산수', category: '간식/음료', unit: '500ml 20입', price: 12000, icon: '🫧' },
  { id: 'b5', name: '이온음료', category: '간식/음료', unit: '1.5L', price: 2800, icon: '🧃' },
  { id: 'b6', name: '생수', category: '간식/음료', unit: '2L 6개', price: 4000, icon: '💧' },
  { id: 'b7', name: '오렌지주스', category: '간식/음료', unit: '1.5L', price: 3500, icon: '🧃' },
  { id: 'b8', name: '사과주스', category: '간식/음료', unit: '1.5L', price: 3500, icon: '🧃' },
  { id: 'b9', name: '포도주스', category: '간식/음료', unit: '1.5L', price: 3500, icon: '🧃' },
  { id: 'b10', name: '토마토주스', category: '간식/음료', unit: '1.5L', price: 3800, icon: '🧃' },
  { id: 'b11', name: '캔커피', category: '간식/음료', unit: '6캔', price: 4500, icon: '☕' },
  { id: 'b12', name: '믹스커피', category: '간식/음료', unit: '100T', price: 13000, icon: '☕' },
  { id: 'b13', name: '녹차 티백', category: '간식/음료', unit: '50T', price: 5000, icon: '🍵' },
  { id: 'b14', name: '보리차 티백', category: '간식/음료', unit: '30T', price: 4000, icon: '🍵' },
  { id: 'sn1', name: '감자칩', category: '간식/음료', unit: '1봉지', price: 1500, icon: '🍪' },
  { id: 'sn2', name: '나초', category: '간식/음료', unit: '1봉지', price: 2500, icon: '🌮' },
  { id: 'sn3', name: '팝콘', category: '간식/음료', unit: '1봉지', price: 1500, icon: '🍿' },
  { id: 'sn4', name: '초코파이', category: '간식/음료', unit: '12입 1박스', price: 4500, icon: '🥧' },
  { id: 'sn5', name: '빼빼로', category: '간식/음료', unit: '1갑', price: 1500, icon: '🍫' },
  { id: 'sn6', name: '새우깡', category: '간식/음료', unit: '1봉지', price: 1400, icon: '🍤' },
  { id: 'sn7', name: '쿠키 세트', category: '간식/음료', unit: '1박스', price: 8000, icon: '🍪' },
  { id: 'sn8', name: '비스킷', category: '간식/음료', unit: '1박스', price: 2500, icon: '🍘' },
  { id: 'sn9', name: '초콜릿', category: '간식/음료', unit: '1개', price: 1200, icon: '🍫' },
  { id: 'sn10', name: '젤리', category: '간식/음료', unit: '1봉지', price: 1500, icon: '🍬' },
  { id: 'sn11', name: '사탕', category: '간식/음료', unit: '1봉지', price: 3000, icon: '🍭' },
  { id: 'sn12', name: '아이스크림 (바)', category: '간식/음료', unit: '10개', price: 6000, icon: '🍦' },
  { id: 'sn13', name: '아이스크림 (통)', category: '간식/음료', unit: '1통', price: 5000, icon: '🍨' },
  { id: 'sn14', name: '시리얼', category: '간식/음료', unit: '1갑(600g)', price: 7000, icon: '🥣' },
  { id: 'sn15', name: '에너지바', category: '간식/음료', unit: '4입', price: 4000, icon: '🍫' },
  { id: 'sn16', name: '아몬드', category: '간식/음료', unit: '1봉(500g)', price: 9000, icon: '🥜' },
  { id: 'sn17', name: '호두', category: '간식/음료', unit: '1봉(400g)', price: 10000, icon: '🥜' },
  { id: 'sn18', name: '믹스넛', category: '간식/음료', unit: '1통', price: 12000, icon: '🥜' },

  // === 생필품 ===
  { id: 'h1', name: '두루마리 휴지', category: '생필품', unit: '30롤', price: 18000, icon: '🧻' },
  { id: 'h2', name: '갑티슈', category: '생필품', unit: '3개입', price: 6500, icon: '🤧' },
  { id: 'h3', name: '물티슈', category: '생필품', unit: '100매 10팩', price: 12000, icon: '🧴' },
  { id: 'h4', name: '키친타올', category: '생필품', unit: '6롤', price: 7500, icon: '🧻' },
  { id: 'h5', name: '생리대 (중형)', category: '생필품', unit: '36개입', price: 15000, icon: '🩸' },
  { id: 'h6', name: '샴푸', category: '생필품', unit: '1L', price: 11000, icon: '🚿' },
  { id: 'h7', name: '린스/컨디셔너', category: '생필품', unit: '1L', price: 11000, icon: '🚿' },
  { id: 'h8', name: '바디워시', category: '생필품', unit: '900ml', price: 9000, icon: '🧼' },
  { id: 'h9', name: '비누', category: '생필품', unit: '4개입', price: 5000, icon: '🧼' },
  { id: 'h10', name: '클렌징폼', category: '생필품', unit: '150ml', price: 8000, icon: '🧴' },
  { id: 'h11', name: '치약', category: '생필품', unit: '3개입', price: 4500, icon: '🪥' },
  { id: 'h12', name: '칫솔', category: '생필품', unit: '5개입', price: 6000, icon: '🪥' },
  { id: 'h13', name: '가글', category: '생필품', unit: '750ml', price: 6500, icon: '💧' },
  { id: 'h14', name: '면도기 세트', category: '생필품', unit: '1세트', price: 15000, icon: '🪒' },
  { id: 'h15', name: '세탁세제 (액체)', category: '생필품', unit: '3L', price: 12000, icon: '🧺' },
  { id: 'h16', name: '세탁세제 (캡슐)', category: '생필품', unit: '30개입', price: 14000, icon: '🧺' },
  { id: 'h17', name: '섬유유연제', category: '생필품', unit: '2L', price: 8000, icon: '🌸' },
  { id: 'h18', name: '주방세제', category: '생필품', unit: '1L', price: 4500, icon: '🍽️' },
  { id: 'h19', name: '고무장갑', category: '생필품', unit: '2켤레', price: 3500, icon: '🧤' },
  { id: 'h20', name: '수세미', category: '생필품', unit: '3개입', price: 2500, icon: '🧽' },
  { id: 'h21', name: '락스', category: '생필품', unit: '2L', price: 3000, icon: '🧴' },
  { id: 'h22', name: '화장실용 세제', category: '생필품', unit: '500ml', price: 4000, icon: '🚽' },
  { id: 'h23', name: '방향제', category: '생필품', unit: '1개', price: 5500, icon: '🌸' },
  { id: 'h24', name: '탈취제', category: '생필품', unit: '1통', price: 6000, icon: '💨' },
  { id: 'h25', name: '쓰레기봉투 (20L)', category: '생필품', unit: '20장', price: 10000, icon: '🗑️' },
  { id: 'h26', name: '지퍼백', category: '생필품', unit: '50매', price: 4000, icon: '🛍️' },
  { id: 'h27', name: '위생장갑', category: '생필품', unit: '100매', price: 2000, icon: '🧤' },
  { id: 'h28', name: '종이컵', category: '생필품', unit: '100개입', price: 1500, icon: '🥤' },
  { id: 'h29', name: '건전지 (AA)', category: '생필품', unit: '10개입', price: 6000, icon: '🔋' },
  { id: 'h30', name: '건전지 (AAA)', category: '생필품', unit: '10개입', price: 6000, icon: '🔋' },

  // === 기타 (조미료/면류/통조림 등) ===
  { id: 'o1', name: '식용유', category: '기타', unit: '900ml', price: 4500, icon: '🛢️' },
  { id: 'o2', name: '참기름', category: '기타', unit: '300ml', price: 8000, icon: '🛢️' },
  { id: 'o3', name: '올리브유', category: '기타', unit: '500ml', price: 9500, icon: '🛢️' },
  { id: 'o4', name: '진간장', category: '기타', unit: '860ml', price: 6000, icon: '🏺' },
  { id: 'o5', name: '고추장', category: '기타', unit: '1kg', price: 11000, icon: '🏺' },
  { id: 'o6', name: '된장', category: '기타', unit: '1kg', price: 9500, icon: '🏺' },
  { id: 'o7', name: '쌈장', category: '기타', unit: '500g', price: 4500, icon: '🏺' },
  { id: 'o8', name: '소금', category: '기타', unit: '1kg', price: 3000, icon: '🧂' },
  { id: 'o9', name: '설탕', category: '기타', unit: '1kg', price: 2500, icon: '🧂' },
  { id: 'o10', name: '고춧가루', category: '기타', unit: '500g', price: 15000, icon: '🌶️' },
  { id: 'o11', name: '후추', category: '기타', unit: '1병', price: 3500, icon: '🧂' },
  { id: 'o12', name: '마요네즈', category: '기타', unit: '500g', price: 4500, icon: '🥫' },
  { id: 'o13', name: '케첩', category: '기타', unit: '500g', price: 3500, icon: '🍅' },
  { id: 'o14', name: '파스타소스(토마토)', category: '기타', unit: '600g', price: 5000, icon: '🍝' },
  { id: 'o15', name: '카레가루', category: '기타', unit: '1봉(100g)', price: 2500, icon: '🍛' },
  { id: 'o16', name: '밀가루', category: '기타', unit: '1kg', price: 2000, icon: '🌾' },
  { id: 'o17', name: '부침가루', category: '기타', unit: '1kg', price: 2500, icon: '🥞' },
  { id: 'o18', name: '튀김가루', category: '기타', unit: '1kg', price: 2500, icon: '🍤' },
  { id: 'o19', name: '쌀', category: '기타', unit: '10kg', price: 30000, icon: '🍚' },
  { id: 'o20', name: '현미', category: '기타', unit: '4kg', price: 16000, icon: '🍚' },
  { id: 'o21', name: '라면 (봉지)', category: '기타', unit: '5개입', price: 4500, icon: '🍜' },
  { id: 'o22', name: '라면 (컵)', category: '기타', unit: '1개', price: 1500, icon: '🍜' },
  { id: 'o23', name: '소면', category: '기타', unit: '900g', price: 3500, icon: '🍝' },
  { id: 'o24', name: '스파게티면', category: '기타', unit: '500g', price: 2500, icon: '🍝' },
  { id: 'o25', name: '즉석밥', category: '기타', unit: '12개입', price: 13000, icon: '🍚' },
  { id: 'o26', name: '참치 통조림', category: '기타', unit: '4캔', price: 9000, icon: '🐟' },
  { id: 'o27', name: '스팸 통조림', category: '기타', unit: '3캔', price: 12000, icon: '🥫' },
  { id: 'o28', name: '식빵', category: '기타', unit: '1봉', price: 3500, icon: '🍞' },
  { id: 'o29', name: '딸기잼', category: '기타', unit: '1병', price: 5000, icon: '🍓' },
  { id: 'o30', name: '땅콩버터', category: '기타', unit: '1병', price: 6500, icon: '🥜' }
];
