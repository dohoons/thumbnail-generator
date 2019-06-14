const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const sharp = require('sharp');
const figlet = require('figlet');

function generate() {
  const input = './input/large.jpg';
  const outputDir = './output';
  const outputName = 'resize';
  const outputFormat = 'jpg';
  const outputSizeSet = [
    {
      width: 300,
      height: 500,
      quality: 80,
    },
    {
      width: 300,
      height: 100,
      quality: 100,
    },
    {
      width: 200,
      height: 200,
      quality: 100,
    },
    {
      width: 100,
      height: 100,
      quality: 100,
    }
  ];

  const works = [];
  
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
    }).toFile(`./output/${outputName}-${width}x${height}.${outputFormat}`);
      
    works.push(work);
  });

  Promise.all(works).finally(() => {
    console.log(chalk.rgb(0, 255, 255)(`=== 썸네일 생성 결과 ===
${outputSizeSet.map(({ width, height }) => {
  return `./output/${outputName}-${width}x${height}.${outputFormat}`;
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

      inquirer.prompt([{
        type: 'input',
        name: 'directory',
        message: '원본 이미지 파일이 위치한 폴더의 경로를 입력하세요.',
        default: '.',
      }, {
        type: 'list',
        name: 'confirm',
        choices: ['예', '아니오'],
        message: '썸네일 이미지를 생성하시겠습니까?',
      }])
        .then((answers) => {
          if(answers.confirm === '예') {
            console.log(chalk.rgb(255, 255, 0)(`=== 대상경로 : ${answers.directory}`));
            generate();
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
