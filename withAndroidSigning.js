// FILE: plugins/withAndroidSigning.js
const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Gradle(groovy) 텍스트에서 특정 블록(예: signingConfigs { ... })을
 * 중괄호 깊이로 안전하게 찾아 제거합니다. (정규식으로 상위 }까지 먹는 사고 방지)
 */
function removeBlockAll(src, blockName) {
  let out = src;
  while (true) {
    const re = new RegExp(`(^|\\s)${blockName}\\s*\\{`, "m");
    const m = re.exec(out);
    if (!m) break;

    const start = m.index + m[1].length;
    const braceStart = out.indexOf("{", start);
    if (braceStart < 0) break;

    let depth = 0;
    let end = -1;

    for (let i = braceStart; i < out.length; i++) {
      const ch = out[i];
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end < 0) break;

    // 블록 앞뒤 공백/개행 조금 정리
    const before = out.slice(0, start);
    const after = out.slice(end + 1);
    out = before.replace(/[ \t]*$/m, "") + "\n" + after.replace(/^\s*\n/, "");
  }
  return out;
}

function findBlock(src, blockName) {
  const re = new RegExp(`(^[\\t ]*)${blockName}\\s*\\{`, "m");
  const m = re.exec(src);
  if (!m) return null;

  const blockStart = m.index;
  const braceStart = src.indexOf("{", blockStart);
  if (braceStart < 0) return null;

  let depth = 0;
  let end = -1;

  for (let i = braceStart; i < src.length; i++) {
    const ch = src[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end < 0) return null;

  return {
    start: blockStart,
    end: end + 1, // inclusive end -> exclusive index
    indent: m[1] || "",
    text: src.slice(blockStart, end + 1),
  };
}

function upsertSigningConfigLine(buildTypeBlockText, typeName, signingLine) {
  const typeBlock = findBlock(buildTypeBlockText, typeName);
  if (!typeBlock) return buildTypeBlockText;

  const headerEnd = typeBlock.text.indexOf("{") + 1;
  const head = typeBlock.text.slice(0, headerEnd);
  let body = typeBlock.text.slice(headerEnd, -1); // without last "}"

  // 기존 signingConfig 라인 제거
  body = body.replace(/^\s*signingConfig\s+signingConfigs\..*$/gm, "").replace(/\n{3,}/g, "\n\n");

  // 들여쓰기 계산 (type 블록 indent + 4칸)
  const baseIndentMatch = new RegExp(`(^[\\t ]*)${typeName}\\s*\\{`, "m").exec(typeBlock.text);
  const baseIndent = baseIndentMatch ? baseIndentMatch[1] : "";
  const innerIndent = baseIndent + "    ";

  // signingConfig 삽입(블록 최상단)
  const insert = `\n${innerIndent}${signingLine}\n`;
  const newTypeText = head + insert + body.replace(/^\s*\n/, "\n") + "}";

  // 원본 buildTypes 블록 내에서 교체
  return (
    buildTypeBlockText.slice(0, typeBlock.start) +
    newTypeText +
    buildTypeBlockText.slice(typeBlock.end)
  );
}

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") return config;

    let contents = config.modResults.contents;

    // 0) android 블록이 없으면 건드리지 않음
    const androidBlock = findBlock(contents, "android");
    if (!androidBlock) {
      config.modResults.contents = contents;
      return config;
    }

    // 1) 기존 signingConfigs 블록은 안전하게 전부 제거(중복/꼬임 방지)
    contents = removeBlockAll(contents, "signingConfigs");

    // 2) 우리가 원하는 signingConfigs 블록(고정 키) 주입(중복 방지: 키 파일명으로 체크)
    const signingConfigsText = `
    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file("../../my-release-key.keystore")
            storePassword "123456"
            keyAlias "my-key-alias"
            keyPassword "123456"
        }
    }
`;

    if (!contents.includes("my-release-key.keystore")) {
      contents = contents.replace(/android\s*\{/, (m) => `${m}${signingConfigsText}`);
    }

    // 3) buildTypes 블록을 찾아서 debug/release에 signingConfig를 강제 주입(기존 옵션은 유지)
    const bt = findBlock(contents, "buildTypes");
    if (bt) {
      let btText = bt.text;

      // debug / release 블록에 signingConfig 강제
      btText = upsertSigningConfigLine(btText, "debug", "signingConfig signingConfigs.debug");
      btText = upsertSigningConfigLine(btText, "release", "signingConfig signingConfigs.release");

      contents = contents.slice(0, bt.start) + btText + contents.slice(bt.end);
    }

    config.modResults.contents = contents;
    return config;
  });
};
