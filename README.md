# Restaurant Reviews Progressive Web App
Mobile Web Specialist Nanodegree final Project
A progressive web app for restaurants reviews build using html, css and JS

## Features
- Full responsive layout
- Responsive images, both for sizing and art direction
- Accessibile using Aria attributes
- Offline capable using service worker and IndexedDB
- Cache images and static files using cache storage
- Store restaurants and reviews in IndexedDB using IDB
- Backgroung sync for the reviews so users can add reviews even if offline
- Scores higher than 90% for performance, accessibility, SEO, best practise and progressive web app in [Lighthouse]('https://developers.google.com/web/tools/lighthouse')

## Requirement
- [node.js]('https://nodejs.org/en/download/')
- [npm]('https://www.npmjs.com/get-npm')

## Install
1. first you need to install the server from this [repo]('https://github.com/udacity/mws-restaurant-stage-3') and follow the instruction in its readme to start the server
2. In the terminal, navigate to this project folder
3. Run `npm install` to install project dependencies
4. Use any local server extention (EX: Live server for VS Code) to run the project or use python3 using this command
```
python3 -m http.server 8000
```
if you use windows use this command
```
python -m http.server 8000
```
5. Open on browser `http://localhost:8000`