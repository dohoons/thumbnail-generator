const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const sharp = require('sharp');
const figlet = require('figlet');
const loadIniFile = require('read-ini-file');
const package = require('./package.json');

const configFileName = 'thumbnail-generate-config.ini';

function generate(directory) {
  let config = {};

  try {
    const configPath = path.join(directory ? directory : __dirname, configFileName);
    config = loadIniFile.sync(configPath);
  } catch (e) {
    console.clear();
    console.log(path.join(directory ? directory : __dirname, configFileName));
    console.log(chalk.rgb(255, 0, 0)(`=== ERROR : 설정파일을 불러오는데 실패했습니다.`));
    start();
    return;
  }

  const { outputName, outputFormat } = config;
  const outputSizeSet = [...config.thumnail.map(set => JSON.parse(set))];
  const works = [];

  const input = path.join(directory ? directory : __dirname, config.input);
  const outputDir = path.join(directory ? directory : __dirname, config.outputDir);
  // console.log(input);
  // console.log(outputDir);
  
  if(fs.existsSync(outputDir) === false) {
    fs.mkdirSync(outputDir);
  }

  outputSizeSet.forEach(({ width, height, background, fit, quality, progressive }) => {
    let work = sharp(input);

    if(outputFormat === 'jpg') {
      work = work.jpeg({
        quality: quality ? quality : 80,
        progressive: Boolean(progressive)
      });
    }

    work.resize(width, height, {
      fit: fit ? fit : 'contain',
      background: background ? background : outputFormat === 'png' ? { r: 255, g: 255, b: 255, alpha: 0 } : '#ffffff'
    }).toFile(path.join(outputDir, `${outputName}-${width}x${height}.${outputFormat}`));
      
    works.push(work);
  });

  Promise.all(works).finally(() => {
    console.log(chalk.rgb(0, 255, 255)(`=== 썸네일 생성 결과 ===
${outputSizeSet.map(({ width, height }) => {
  return path.join(outputDir, `${outputName}-${width}x${height}.${outputFormat}`);
}).join('\n')}
`));

    exit();
  });
}

function start() {
  figlet('Thumbnail Generator', function(err, data) {
      if (err) {
        console.log('Something went wrong...');
        console.dir(err);

        setTimeout(() => {}, 50000)
        return;
      }

      console.log(data);
      console.log(`   author: ${package.author.name}(${package.author.email}), version: v${package.version}\n`);

      inquirer.prompt([{
        type: 'input',
        name: 'directory',
        message: '이미지 설정 파일이 위치한 폴더의 경로를 입력하세요.',
      }, {
        type: 'list',
        name: 'confirm',
        choices: ['예', '아니오'],
        message: '썸네일 이미지를 생성하시겠습니까?',
      }])
        .then((answers) => {
          if(answers.confirm === '예') {
            console.log(chalk.rgb(255, 255, 0)(`=== 대상경로 : ${answers.directory ? answers.directory : '.'}/${configFileName}`));
            generate(answers.directory);
          } else {
            exit();
          }
        });
  });
}

function exit() {
  inquirer.prompt([{
    type: 'list',
    name: 'exit',
    choices: ['종료', '처음부터'],
    message: '프로그램을 종료하시겠습니까?',
  }])
    .then((answers) => {
      if(answers.exit === '처음부터') {
        console.clear();
        start();
      } else {
        console.log('EXIT');
        setTimeout(() => {}, 500);
      }
    });
}

start();
