# Jaeyeong Kim — Academic Homepage

KAIST AI 연구자 홈페이지입니다. 별도의 프레임워크나 패키지 설치 없이 Node.js만으로 빌드하며, GitHub Pages에 배포할 수 있습니다.

## 로컬 실행

Node.js 22 이상이 필요합니다. `.nvmrc`는 Node.js 24를 사용합니다.

```sh
npm run dev
```

<http://localhost:4321>을 엽니다. 파일을 수정하면 자동으로 재빌드됩니다. 브라우저를 새로고침하면 반영됩니다. `npm install`은 필요하지 않습니다.

```sh
npm run build   # dist/에 정적 사이트 생성
npm run check   # 링크, 에셋, 메타데이터와 콘텐츠 검사
npm run preview # 빌드 결과를 localhost:4321에서 확인
```

다른 포트는 `npm run dev -- --port 4322`로 지정합니다.

## GitHub Pages 배포

- 사이트: <https://kjae0.github.io/>
- 저장소: <https://github.com/kjae0/kjae0.github.io>

GitHub Pages의 배포 소스는 **GitHub Actions**를 사용합니다. `main`에 push하면 `.github/workflows/deploy.yml`이 사이트를 빌드하고 검사한 후 `dist/`를 자동 배포합니다. PR에서는 빌드와 검사만 실행합니다.

```sh
git clone https://github.com/kjae0/kjae0.github.io.git
cd kjae0.github.io
npm run dev
```

수정 후 배포:

```sh
npm run build
npm run check
git add .
git commit -m "Update homepage"
git push origin main
```

배포 진행 상황은 저장소의 **Actions** 탭에서 확인할 수 있습니다. 기존 CV 파일은 `public/assets/my_cv.pdf`와 `public/assets/my_cv_c.pdf`에 보관하며, 기존 `/assets/my_cv.pdf`와 `/assets/my_cv_c.pdf` 주소를 유지합니다.

공식 가이드: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## 내용 수정

대부분의 수정은 **`content/site.json` 한 파일**에서 할 수 있습니다.

| 항목 | 설정 |
| --- | --- |
| 소개 | `bio`, `description` (`interests`는 검색용 구조화 데이터) |
| 연락 문구와 이메일 | `contactText`, `email` (주소를 넣으면 메일 링크 표시) |
| 프로필 링크 | `social.scholar`, `social.github`, `social.linkedin` |
| 프로필 이미지 | `portrait`, `portraitAlt`, `portraitIsPlaceholder`, `portraitWidth`, `portraitHeight` |
| 논문 | `publications` 배열 |
| 소식 | `news` 배열, 최근 항목부터 입력 |
| 학력 | `education` 배열 |
| 최종 수정일 | `updated` (`YYYY-MM-DD`) |
| 실제 배포 주소 | `siteUrl` |

### 프로필 링크

Scholar, GitHub, LinkedIn은 실제 프로필에 연결되어 있습니다. 이메일은 다른 프로필 링크와 같은 줄에 `Email`로 표시하며, 클릭하면 메일 앱을 엽니다. 변경할 때는 `content/site.json`의 `email`과 `social`을 수정합니다. 프로필 주소를 빈 문자열로 두면 해당 링크는 “Link coming soon” placeholder로 표시됩니다.

### 이미지 교체

1. 프로필 사진을 `public/assets/images/portrait.jpg`로 저장합니다.
2. `portrait`를 `assets/images/portrait.jpg`로 바꿉니다.
3. `portraitAlt`를 `Portrait of Jaeyeong Kim`, `portraitIsPlaceholder`를 `false`로 바꿉니다.
4. `portraitWidth`와 `portraitHeight`에 원본의 가로·세로 픽셀 수를 입력합니다.
5. 논문 그림은 같은 디렉터리에 넣고 각 논문의 `image`를 `assets/images/t2mo.webp`처럼 설정합니다. 빈 값이면 placeholder를 표시합니다.
6. 각 논문의 `imageWidth`, `imageHeight`에는 원본 이미지 또는 영상의 가로·세로 픽셀 수를 넣습니다.
7. 동영상은 `public/assets/videos/`에 저장하고 `video`를 `assets/videos/t2mo.mp4`처럼 지정합니다. `image`는 영상이 재생되기 전의 포스터로 사용합니다.

프로필과 논문 이미지는 원본 비율을 유지하며 자르지 않습니다. 현재 T2Mo는 제공받은 MP4, SpLap·MV-TAP·MORPHOS는 제공받은 PNG를 사용합니다. 모든 파일은 저장소에 포함되어 GitHub Pages에 함께 배포됩니다. 영상은 무음 반복 재생되며 기본 재생 컨트롤을 제공합니다. 동작 줄이기 설정이 켜져 있거나 JavaScript를 끈 경우 직접 재생할 수 있습니다.

### 논문과 소식 추가

기존 항목을 복사해 `id`, `title`, `authors`, `year`, `venue`, `links` 등을 수정합니다. `id`는 영문 소문자·숫자·하이픈으로 된 고유 값이어야 합니다. `type`은 `preprint`, `conference`, `journal` 중 하나입니다.

- `preprint`: `arxiv`에 arXiv ID를 넣습니다.
- `conference`: `booktitle`에 학회명을 넣습니다.
- `journal`: `doi`에 DOI를 넣습니다.
- `citationTitle`을 지정하면 화면 제목과 BibTeX 제목을 다르게 설정할 수 있습니다.
- `news[].publication`은 연결할 논문의 `id`입니다.
- `news[].text`에서 `**텍스트**`로 감싼 부분은 굵게 표시됩니다. 모델명과 학회명에 사용합니다.

논문은 연도 내림차순으로 표시하며 같은 연도에서는 입력 순서를 유지합니다. 연도 필터와 BibTeX는 자동 생성됩니다. JavaScript를 꺼도 전체 논문·뉴스·학력과 링크를 읽을 수 있습니다.

## 파일 구성

```text
content/site.json         프로필, 논문, 학력 및 링크
src/index.html            HTML 템플릿
public/assets/styles.css  레이아웃 및 반응형 스타일
public/assets/main.js     필터, 인용 복사, 영상 재생
public/assets/images/     이미지와 SVG placeholder
public/assets/videos/     논문 미리보기 영상
public/assets/fonts/      Raleway 폰트와 라이선스
scripts/build.mjs         정적 HTML 생성
scripts/serve.mjs         로컬 미리보기 서버
scripts/check.mjs         빌드 검증
.github/workflows/deploy.yml  GitHub Pages 자동 배포
dist/                     생성 결과 — 직접 수정하지 않음
```

참고 사이트와 같은 Raleway 폰트를 자체 호스팅하며, 로드되지 않으면 Helvetica 또는 Arial을 사용합니다. CDN, 추적 스크립트, API 키 또는 백엔드 없이 동작합니다.

## 콘텐츠 근거

학력·과정·지도교수는 사용자가 제공한 정보를 반영했고, 재학 기간과 서울대학교 전공은 입력하지 않았습니다. 연구 소개는 사용자가 제공한 연구 관심사를 영문으로 정리했습니다. News에는 학회 채택과 MORPHOS의 arXiv 공개 소식을 넣었고, 정확한 발표 월을 입력받지 않아 연도만 표시합니다. 최근 다섯 항목까지 바로 표시하며, 이전 소식은 펼쳐서 볼 수 있습니다.

- [Google Scholar 프로필](https://scholar.google.com/citations?user=7rvZgpEAAAAJ&hl=ko) — 이름, 소속, 논문 목록. 중복 MV-TAP 항목은 통합했습니다.
- [T2Mo](https://arxiv.org/abs/2606.05162), [프로젝트](https://cvlab-kaist.github.io/T2Mo/) — NeurIPS 2026, 사용자가 제공한 학회 정보를 반영했습니다.
- [MORPHOS](https://arxiv.org/abs/2606.02491)
- [MV-TAP](https://arxiv.org/abs/2512.02006) — 저자명은 arXiv 기준, CVPR 2026은 Scholar 기준.
- [SpLap](https://arxiv.org/abs/2511.19542), [공식 저장소](https://github.com/kjae0/SpLap) — 3DV 2026.

디자인 참고: [Chaehyun Kim](https://kchyun.github.io/). 본 사이트의 코드와 placeholder는 새로 작성했습니다.
