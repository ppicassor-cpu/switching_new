const fs = require('fs');
const path = require('path');

// 1. 설정 및 경로 정의
const appJsonPath = path.resolve('app.json');
const bundleDir = path.join('android', 'app', 'build', 'outputs', 'bundle', 'release');
const sourceFile = path.join(bundleDir, 'app-release.aab');

// 2. 버전 및 날짜 정보 가져오기
let versionCode = 'unknown';
let appName = 'myapp';

if (fs.existsSync(appJsonPath)) {
  try {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf-8'));
    versionCode = appJson.expo?.android?.versionCode || 'unknown';
    appName = appJson.expo?.slug || 'myapp';
  } catch (e) {
    console.error('app.json 파싱 실패:', e.message);
  }
}

const now = new Date();
const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

// 3. 새 파일명 생성
const newFileName = `${appName}-v${versionCode}-${dateStr}.aab`;
const targetFile = path.join(bundleDir, newFileName);
const rootTargetFile = path.join(process.cwd(), newFileName);

// 4. 파일 처리
if (fs.existsSync(sourceFile)) {
  // bundle/release 폴더 안에 새 이름으로 복사
  fs.copyFileSync(sourceFile, targetFile);

  // 프로젝트 루트에도 복사 (필요 시)
  fs.copyFileSync(sourceFile, rootTargetFile);

  console.log('--------------------------------------------------');
  console.log(`✅ 관리용 파일 생성 완료!`);
  console.log(`📂 새 파일명: ${newFileName}`);
  console.log(`📍 위치:`);
  console.log(`   - ${targetFile}`);
  console.log(`   - ${rootTargetFile}`);
  console.log('--------------------------------------------------');
} else {
  console.error('❌ app-release.aab 파일을 찾을 수 없습니다.');
  console.error('   → 먼저 아래 명령어로 빌드하세요:');
  console.error('     cd android && ./gradlew bundleRelease');
}