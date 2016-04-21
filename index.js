'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const childProcess = require('child_process');
let kibana = childProcess.exec('./kibana/bin/kibana');

//setTimeout( () => {
		// report crashes to the Electron project
		// require('crash-reporter').start();

		// prevent window being GC'd
		let mainWindow = null;

		app.on('window-all-closed', function () {
			app.quit();
		});

		app.on('ready', function () {
			mainWindow = new BrowserWindow({
				width: 600,
				height: 400,
				resizable: true
			});

			setTimeout( () => {
				mainWindow.loadUrl(`http://0.0.0.0:5601/app/sense`);
			}, 15000);

			//mainWindow.loadUrl(`http://0.0.0.0:5601/app/sense`);
			mainWindow.on('closed', () => {
				// deref the window
				// for multiple windows store them in an array
				mainWindow = null;
			});
		});

//}, 2000);
