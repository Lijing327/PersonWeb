const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { minify } = require('cssmin');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// CSS 文件合并顺序
const cssImportOrder = [
  'base.css',
  'tokens.css',
  'themes.css',
  'components.css',
  'ui-patch-naive.css',
  'home.css',
  'tools.css',
  'projects.css',
  'blog.css',
  'about.css',
  'investment.css',
  'header.css',
  'footer.css',
  'hero.css',
  'visitor-interaction.css',
  'admin-asset-management.css',
  'charts.css',
  'animations.css',
  'responsive.css',
  'print.css'
];

async function buildCSS() {
  const cssDir = path.join(__dirname, '../assets/css');
  const outputPath = path.join(cssDir, 'bundle.css');

  try {
    // 创建输出目录
    await mkdir(path.dirname(outputPath), { recursive: true });

    // 读取并合并所有 CSS 文件
    let combinedCSS = '';

    for (const file of cssImportOrder) {
      const filePath = path.join(cssDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`正在读取: ${file}`);
        const css = await readFile(filePath, 'utf8');
        combinedCSS += `/* ${file} */\n${css}\n\n`;
      }
    }

    // 压缩 CSS
    console.log('正在压缩 CSS...');
    const minifiedCSS = minify(combinedCSS);

    // 写入合并后的文件
    await writeFile(outputPath, minifiedCSS);
    console.log(`CSS 优化完成！输出文件: ${outputPath}`);

    // 显示优化统计
    const originalSize = Buffer.byteLength(combinedCSS, 'utf8');
    const minifiedSize = Buffer.byteLength(minifiedCSS, 'utf8');
    const savings = ((originalSize - minifiedSize) / originalSize * 100).toFixed(2);

    console.log(`原始大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`压缩后: ${(minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`节省空间: ${savings}%`);

  } catch (error) {
    console.error('CSS 构建错误:', error);
  }
}

// 运行构建
buildCSS();