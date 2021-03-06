const fs = require('fs');
const path = require('path');
const glob = require('glob-all');
const inquirer = require('inquirer');
const chalk = require('chalk');
const sharp = require('sharp');
const figlet = require('figlet');
const loadIniFile = require('read-ini-file');
const package = require('./package.json');

const configFileName = 'thumbnail-config.ini';

function loadConfig(directory) {
  const dirname = directory ? directory : process.cwd();
  const configPath = path.join(dirname, configFileName);

  try {
    const config = loadIniFile.sync(configPath);
    const { outputName, outputFormat } = config;
    const outputDir = path.join(dirname, config.outputDir);
    const outputSizeSet = config.thumnail.map(set => JSON.parse(set));
    const input = config.input.map(filepath => path.join(dirname, filepath)).reduce((p,c) => {
      return p.concat(
        c.split(path.sep).pop() === "*" ? glob.sync([
          `${c.split('*')[0]}/**/*.png`,
          `${c.split('*')[0]}/**/*.jpg`,
          `${c.split('*')[0]}/**/*.gif`
        ]).map(file => path.resolve(file)) : c
      );
    }, []);

    return {
      input,
      outputDir,
      outputName,
      outputFormat,
      outputSizeSet,
    };

  } catch(e) {
    console.clear();
    console.log(e)
    console.log(chalk.rgb(255, 0, 0)(`=== ERROR : 설정파일을 불러오는데 실패했습니다.`));
    console.log(configPath);
    if(e instanceof SyntaxError) {
      console.log(chalk.rgb(255, 0, 0)('    설정파일 형식이 잘못되었습니다.'))
    }
    start();
  }
}

function generate(directory) {
  const { input, outputDir, outputName, outputFormat, outputSizeSet } = loadConfig(directory);
    
  if(fs.existsSync(outputDir) === false) {
    fs.mkdirSync(outputDir);
  }

  const works = input.map((filepath, index) => {
    return outputSizeSet.map(({ suffix, width, height, background, fit, quality, progressive }) => {
      const filename = outputName[index] ? outputName[index] : filepath.split(path.sep).pop().split(".")[0]
      const suffixStr = suffix ? suffix : `-${width ? width : 'auto'}x${height ? height : 'auto'}`
      const outputPath = path.join(outputDir, `${filename}${suffixStr}.${outputFormat}`);
      let work = sharp(filepath);

      if(outputFormat === 'jpg') {
        work = work.jpeg({
          quality: quality ? quality : 80,
          progressive: Boolean(progressive)
        });
      }

      if(outputFormat === 'jpg') {
        work
          .flatten({
            background: background ? `#${background}` : '#ffffff'
          })
          .resize(width, height, {
            fit: fit || 'contain',
            background: background ? `#${background}` : '#ffffff'
          })
          .toFile(outputPath)
          .catch(err => {
            console.log(chalk.rgb(255, 0, 0)(`\n${err.message}: ${filepath}`))
          });
      } else {
        if(background) {
          work.flatten({
            background: `#${background}`
          });
        }
        work
          .resize(width, height, {
            fit: fit || 'contain',
            background: background ? `#${background}` : { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toFile(outputPath)
          .catch(err => {
            console.log(chalk.rgb(255, 0, 0)(`\n${err.message}: ${filepath}`))
          });
      }

      return work;
    });
  }).reduce((p,c) => p.concat(c), []);

  Promise.all(works).then(res => {
    console.log(chalk.rgb(0, 255, 255)(`=== 썸네일 생성 결과 ===\n  ${res.map(r => r.options.fileOut).join('\n  ')}\n`));
    exit();
  });
}

function start() {
  figlet(`Thumbnail${process.stdout.columns < 100 ? '\n  ' : ''} Generator`, function(err, data) {
    if(err) {
      console.log('Something went wrong...');
      console.dir(err);

      setTimeout(() => {}, 50000)
      return;
    }

    console.log(data);
    console.log(`   author: ${package.author.name}(${package.author.email}), version: v${package.version}\n`);

    inquirer.prompt([
      {
        type: 'input',
        name: 'directory',
        message: '썸네일 설정 파일 경로를 입력하세요. 예) C:\\mywork\n마우스 우클릭으로 폴더경로 붙여넣기 후 엔터 =>',
      },
      {
        type: 'list',
        name: 'confirm',
        choices: ['예', '아니오', '다시시작'],
        message: '썸네일 이미지를 생성하시겠습니까?',
      },
    ])
      .then((answers) => {
        if(answers.confirm === '예') {
          console.log(chalk.rgb(255, 255, 0)(`=== 대상경로===\n  ${path.join(answers.directory ? answers.directory : process.cwd(), configFileName)}`));
          generate(answers.directory);
        } else if(answers.confirm === '다시시작') {
          console.clear();
          start();
        } else {
          exit();
        }
      });
  });
}

function exit() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'exit',
      choices: ['종료', '처음부터'],
      message: '프로그램을 종료하시겠습니까?',
    },
  ])
    .then((answers) => {
      if(answers.exit === '처음부터') {
        console.clear();
        start();
      } else {
        console.log('EXIT');
        setTimeout(() => {}, 300);
      }
    });
}

start();
