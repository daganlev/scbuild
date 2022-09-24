const fs = require('fs');
const glob = require('glob');
const ts = require('typescript');
const UglifyJS = require('uglify-js');
const sass = require('sass');
const postcss = require('postcss');
const cssnano = require('cssnano');

let scriptsRunning = false;
let stylesRunning = false;

//init
updateStyles();
updateScripts();

fs.watch('./ts',{},function(evt, file){
    if(!scriptsRunning)
        updateScripts();
});

fs.watch('./scss',{},function(evt, file){
    if(!stylesRunning)
        updateStyles();
});

function updateScripts(){
    scriptsRunning = true;
    
    fs.rmSync('./js', { recursive: true, force: true }); // clean up directory
    fs.mkdirSync('./js');

    glob("./ts/*.ts", null, function (er, files) {
        files.forEach(file => {
            let startTime = performance.now();

            let jsfilename = file.replace("./ts/","./js/").replace(".ts",".js");

            data = fs.readFileSync(file,'utf8');
            
            let tmpRes = ts.transpile(data, {
                "target": "es2016",
                "module": "commonjs",
                "sourceMap": true,
                "inlineSourceMap": true
            }, file);

            let [tempResJS, tempResSource] = tmpRes.split("//# sourceMappingURL=data:application/json;base64,");
            tempResSource = Buffer.from(tempResSource, 'base64').toString('utf8') ;
            tempResSource = tempResSource.replace('"sources":[', '"sources":[".' + file + '",');

            let tmpFile = UglifyJS.minify(tempResJS,  { 
                compress: true,
                mangle: true,
                sourceMap: {
                    content: tempResSource,
                    url: jsfilename.replace("./js/","") + '.map'
                }
            });
            
            fs.writeFileSync(jsfilename, tmpFile.code);
            fs.writeFileSync(jsfilename + '.map', tmpFile.map);

            let diff = ((performance.now() - startTime)/1000).toFixed(3);
            let size = (fs.statSync(jsfilename).size / 1024).toFixed(2);
            console.log(jsfilename + ' \x1b[32mupdated\x1b[0m ' + size + ' KB :: ' + diff + 'sec');
            
        });
        scriptsRunning = false;
    });
}

function updateStyles(){
    stylesRunning = true;
    
    fs.rmSync('./css', { recursive: true, force: true }); // clean up directory
    fs.mkdirSync('./css');

    glob("./scss/*.scss", null, function (er, files) {
        files.forEach(file => {
            //skip scss files with underscore at the start of their name (i.e. _global.scss)
            if(!/scss\/\_/.test(file)){
                let startTime = performance.now();
                try {
                    let res = sass.compile(file, {
                        style: 'compressed',
                        sourceMap: true
                    });

                    if(res.css!=''){
                        //update sources with relative path
                        let tmpSrcs = [];
                        res.sourceMap.sources.forEach(elm => {
                            let tmpEl = elm.split("/");
                            tmpSrcs.push("../scss/" + tmpEl[tmpEl.length-1]);
                        });
                        res.sourceMap.sources = tmpSrcs;
    
                        postcss([cssnano]).process(res.css,  {
                            from: null, 
                            to: null,
                            map: {
                                prev: JSON.stringify(res.sourceMap)
                            }
                        }).then(result => {
                            let cssfilename = file.replace("./scss/","./css/").replace(".scss",".css");
                            fs.writeFileSync(cssfilename, result.css + "\n/*# sourceMappingURL=" + cssfilename.replace("./css/","") + ".map */");
                            fs.writeFileSync(cssfilename + '.map', result.map.toString());
                            let diff = ((performance.now() - startTime)/1000).toFixed(3);
                            let size = (fs.statSync(cssfilename).size / 1024).toFixed(2);
                            console.log(cssfilename + " \x1b[32mupdated\x1b[0m " + size + ' KB :: ' + diff + 'sec');
                        
                        });
                    }else{
                        console.log("\x1b[31mSCSS ERROR - " + file + " is empty\x1b[0m");
                    }

                } catch (error) {
                    console.error("\x1b[31m#### SCSS ERROR - " + file + " ####\x1b[0m");
                    console.log(error);
                    console.error("\x1b[31m########\x1b[0m");
                }
                
            }           
        });
        stylesRunning = false;
    });
}