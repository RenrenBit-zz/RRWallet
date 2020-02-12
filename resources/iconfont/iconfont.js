const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path');
const pwd = process.cwd();

const json = {}
const html = fs.readFileSync( path.resolve(pwd,'resources/iconfont/demo_unicode.html')).toString()
const $ = cheerio.load(html)

var lis = $('.icon_lists.clear').children().each((i, el) => {
    let name = $(el).children('.name').text()
    let t = name.lastIndexOf('_')
    if (t > 0) {
        name = name.substr(0, t)
    }

    let code = $(el).children('.code').text()
    if (code.length <= 3) {
        console.warn()
        return
    }
    code = parseInt("0x" + code.substring(3, code.length - 1))


    json[name] = code
});

try{
    fs.writeFileSync( path.resolve(pwd ,'resources/iconfont/iconfont.json'), JSON.stringify(json), 'utf8');
}catch(e){
    console.log('生成iconfont映射文件失败', e);
}
