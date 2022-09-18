# scbuild
Node JS build to compile, minify and generate source maps for TS and SCSS

## Installation
Copy `node.js` and `package.json` files to an empty directory and run below line to install packages: 
```
npm install
```

Create a `ts` folder and a `scss` folder in the main root and store your typescript files in the `ts` folder and your SCSS files in the `scss` folder.

When the build command is executed the system will loop through all TS files in the `ts` folder, transpile those to JS and minify them - generating a **.js** file in a new `js` directory and a **.js.map** file next to it.

It will do the same to the scss files and put them in a `css` folder - it will skip over any _xxxx.scss files (files with an underscore at the beginning of their name) - so those can be included within other scss files

To run the build use the below command:
```
npm start
```

The output will produce a list of all compiled files, their sizes and how long it took to process them.

In case of a fatal error the script will exit; on SCSS errors the console will show a red error message, on TS errors the system will not create the new .js file.