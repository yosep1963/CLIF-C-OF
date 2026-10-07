# CLIF-C OF Calculator

간경변 환자의 장기부전(CLIF-C OF)을 평가하고 ACLF 등급을 판정하는 PWA입니다.
ACLF면 CLIF-C ACLF 점수, 아니면 CLIF-C AD 점수까지 이어서 계산합니다.
오프라인에서도 동작하며 Netlify에 배포합니다.

## 판정 기준

- **CLIF-C OF 점수·장기부전**: Jalan R, et al. J Hepatol 2014;61:1038-47
  - 신장은 Creatinine ≥2.0 mg/dL 또는 RRT부터 부전 (나머지 장기는 3점)
  - SpO₂를 쓸 때는 PaO₂로 환산하지 않고 SpO₂/FiO₂ 기준 사용 (>357 / >214–≤357 / ≤214)
  - 기계환기: 간성뇌증 때문이면 뇌부전, 그 외 이유면 호흡부전
- **ACLF 등급**: Moreau R, et al. Gastroenterology 2013;144:1426-37 (CANONIC), EASL CPG 2023
- **다음 단계 점수와 예측 사망률**: CLIF-C ACLF (Jalan 2014), CLIF-C AD (Jalan 2015). EF CLIF 공식 계산기와 같은 계수

## 개발

```bash
npm ci          # 의존성 설치 (운영체제가 바뀌면 다시 실행)
npm run dev     # 개발 서버
npm test        # 판정 로직 테스트 (Vitest)
npm run lint    # ESLint
npm run build   # 배포용 빌드 → dist/
```

## 배포

`npm run build`로 만든 `dist/` 폴더를 Netlify 사이트의 Deploys 탭에 끌어다 놓습니다.
응답 헤더와 리다이렉트(`public/_headers`, `public/_redirects`)도 함께 들어갑니다.
