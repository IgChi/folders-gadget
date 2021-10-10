var fs = new ActiveXObject('Scripting.FileSystemObject');
var shell = new ActiveXObject('WScript.Shell');

var gadgetName = System.Gadget.name;
var gadgetPath = System.Gadget.path;
var appsFile = gadgetPath + "\\db\\apps.txt";

// ------------ Settings -----------------------------
var settingsFile = gadgetPath + "\\db\\settings.txt";
var settingsLines = readFile(settingsFile);
var name = settingsLines[0];
var cols = parseInt(settingsLines[1], 10);
var rows = parseInt(settingsLines[2], 10);
var iconSize = parseInt(settingsLines[3], 10);
var colsLarge = parseInt(settingsLines[4], 10);
var rowsLarge = parseInt(settingsLines[5], 10);
var iconSizeLarge = parseInt(settingsLines[6], 10);
var bg = settingsLines[7];
var fontSize = parseInt(settingsLines[8], 10);
// ---------------------------------------------------

var settingsOpened = false;
var selected = null;

function init() {
	System.Gadget.onUndock = render;
	System.Gadget.onDock = render;
	render();
}

// -------------------- DOCK STATE SWITCH --------------------

function render() {
	System.Gadget.beginTransition();

	document.body.style.background = bg;
	document.body.style.fontSize = fontSize + 'px';

	if (System.Gadget.docked) {
		renderClosedView();
	} else {
		renderOpenedView();
	}

	System.Gadget.endTransition(System.Gadget.TransitionType.morph, 1);
}

// -------------------- DND Control --------------------

function dndOver() {
	event.returnValue = false;
}

function addApps() {
	var file = fs.OpenTextFile(appsFile, 8);
	var i = 0;
	var item;
	while (item = System.Shell.itemFromFileDrop(event.dataTransfer, i)) {
		var name = item.name;
		var path = item.path;
		var url = '';

		var ext = fs.GetExtensionName(path).toLowerCase();
		if (ext === 'lnk') {
			path = shell.CreateShortcut(path).TargetPath;
		} else if ( ext === 'url') {
			url = '@' + shell.CreateShortcut(path).TargetPath;
			var lines = readFile(path);
			for (var k = 0; k < lines.length; k++) {
				if (lines[k].indexOf('IconFile=') != -1) {
					path = lines[k].split('=')[1];
				}
			}
		}

		file.WriteLine(name + '@' + path + url);

		i++;
	}

	file.Close();

	render();

	event.returnValue = false;
}

function dndLeave() {
	event.returnValue = false;
}

// -------------------- LAYOUT Control --------------------

function setSize(el, w, h) {
	el.style.width = w + 'px';
	el.style.height = h + 'px';
}

function renderClosedView() {
	document.body.innerHTML = '';
	setSize(document.body, (iconSize + 10) * cols, (iconSize + 10) * rows);

	var bordersDiv = document.createElement('div');
	createBorder(bordersDiv);

	var appsDiv = document.createElement('div');
	appsDiv.id = 'apps';

	document.body.appendChild(appsDiv);
	document.body.appendChild(bordersDiv);

	updateAppsList(cols * rows, iconSize, false);
}

function renderOpenedView() {
	document.body.innerHTML = '';
	setSize(document.body, 80 * colsLarge + 20, (iconSizeLarge + 43) * rowsLarge + 30);

	var bordersDiv = document.createElement('div');
	createBorder(bordersDiv);

	var headerDiv = document.createElement('div');
	headerDiv.id = 'header';
	if (colsLarge >= 2) {
		headerDiv.innerText = name;
	}
	// headerDiv.ondblclick = function() {  };

	var delBtn = document.createElement('button');
	delBtn.id = 'delBtn';
	delBtn.innerText = '🗑';
	delBtn.title = 'Remove Selected App from Gadget & Create Desktop Shortcut';
	delBtn.onclick = function() { if (selected != null) { delApp(); render(); } };

	var moveBackBtn = document.createElement('button');
	moveBackBtn.id = 'moveBackBtn';
	moveBackBtn.innerText = '⮜';
	moveBackBtn.title = 'Move Selected App Back';
	moveBackBtn.onclick = function() { if (selected != null) { moveBack(); } };

	var moveForwardBtn = document.createElement('button');
	moveForwardBtn.id = 'moveForwardBtn';
	moveForwardBtn.innerText = '⮞';
	moveForwardBtn.title = 'Move Selected App Forward';
	moveForwardBtn.onclick = function() { if (selected != null) { moveForward(); } };

	var settingsBtn = document.createElement('button');
	settingsBtn.id = 'settingsBtn';
	settingsBtn.innerText = '⚙';
	settingsBtn.title = 'Open folder settings';
	settingsBtn.onclick = function() { changeSettings(); settingsOpened = !settingsOpened; render(); };

	var settingsDiv = renderSettingsDialog();

	var appsDiv = document.createElement('div');
	appsDiv.id = 'apps';
	appsDiv.style.height = ((iconSizeLarge + 43) * rowsLarge - 5) + 'px';

	headerDiv.appendChild(delBtn);
	headerDiv.appendChild(moveBackBtn);
	headerDiv.appendChild(moveForwardBtn);
	headerDiv.appendChild(settingsBtn);
	document.body.appendChild(headerDiv);
	document.body.appendChild(appsDiv);
	document.body.appendChild(settingsDiv);
	document.body.appendChild(bordersDiv);

	updateAppsList(100, iconSizeLarge, true);
}

function updateAppsList(limit, iconSize, withName) {
	var lines = readFile(appsFile);
	for (var i = 0; i < limit && i < lines.length; i++) {
		var name = lines[i].split('@')[0];
		var path = lines[i].split('@')[1];
		var url = lines[i].split('@')[2];
		renderAppElement(i, name, path, url, iconSize, withName);
	}
	header.title = 'Contains ' + apps.children.length + ' apps | Gadget Name: ' + gadgetName + ' (' + gadgetPath + ')';
	if (selected != null) selectApp(selected);
}

function renderAppElement(i, name, path, url, iconSize, withName) {
	var appDiv = document.createElement('div');
	appDiv.className = 'app';
	appDiv.onclick = function() { selectApp(i) };
	if (url != undefined) {
		appDiv.title = name + ' : ' + url;
		appDiv.ondblclick = function() { runApp(url); appDiv.className = 'app'; };
	} else {
		appDiv.title = name + ' : ' + path;
		appDiv.ondblclick = function() { runApp(path); appDiv.className = 'app'; };
	}

	var iconDiv = document.createElement('div');
	iconDiv.className = 'icon';

	var iconImg = document.createElement('img');
	iconImg.src = 'gimage:///' + path + '?width=' + iconSize + '&height=' + iconSize;

	iconDiv.appendChild(iconImg);
	appDiv.appendChild(iconDiv);

	if (withName) {
		var nameDiv = document.createElement('div');
		nameDiv.id = 'nameDivId';
		nameDiv.innerText = name;
		appDiv.appendChild(nameDiv);
	}

	apps.appendChild(appDiv);
}

function createBorder(border) {
	border.innerHTML += '<img src="../images/borderTL.png" style="position:absolute;top:0;left:0;" />';
	border.innerHTML += '<img src="../images/borderTR.png" style="position:absolute;top:0;right:0;" />';
	border.innerHTML += '<img src="../images/borderBL.png" style="position:absolute;bottom:0;left:0;" />';
	border.innerHTML += '<img src="../images/borderBR.png" style="position:absolute;bottom:0;right:0;" />';
}

function renderSettingsDialog() {
	var settingsDiv = document.createElement('div');
	settingsDiv.id = 'settings';
	if (settingsOpened) {
		settingsDiv.style.display = 'block';
	} else {
		settingsDiv.style.display = 'none';
	}

	var nameInputLabel = document.createElement('label');
	nameInputLabel.innerText = '🤙 Folder Name:';
	nameInputLabel.title = '🤙 Folder Name';
	var nameInput = document.createElement('input');
	nameInput.id = 'nameInput';
	nameInput.style.width = (80 * colsLarge - 40) + 'px';
	nameInput.value = '' + name;

	var colsInputLabel = document.createElement('label');
	colsInputLabel.innerText = 'III Columns in Small View:';
	colsInputLabel.title = 'III Columns in Small View';
	var colsInput = document.createElement('input');
	colsInput.id = 'colsInput';
	colsInput.style.width = (80 * colsLarge - 40) + 'px';
	colsInput.value = '' + cols;

	var rowsInputLabel = document.createElement('label');
	rowsInputLabel.innerText = '☰ Rows:';
	rowsInputLabel.title = '☰ Rows';
	var rowsInput = document.createElement('input');
	rowsInput.id = 'rowsInput';
	rowsInput.style.width = '40 px';
	rowsInput.value = '' + rows;

	var iconSizeInputLabel = document.createElement('label');
	iconSizeInputLabel.innerText = '🎭 Icon Size:';
	iconSizeInputLabel.title = '🎭 Icon Size';
	var iconSizeInput = document.createElement('input');
	iconSizeInput.id = 'iconSizeInput';
	iconSizeInput.style.width = '40 px';
	iconSizeInput.value = '' + iconSize;

	var colsLargeInputLabel = document.createElement('label');
	colsLargeInputLabel.innerText = 'III Columns in Large View:';
	colsLargeInputLabel.title = 'III Columns in Large View';
	var colsLargeInput = document.createElement('input');
	colsLargeInput.id = 'colsLargeInput';
	colsLargeInput.style.width = (80 * colsLarge - 40) + 'px';
	colsLargeInput.value = '' + colsLarge;

	var rowsLargeInputLabel = document.createElement('label');
	rowsLargeInputLabel.innerText = '☰ Rows:';
	rowsLargeInputLabel.title = '☰ Rows';
	var rowsLargeInput = document.createElement('input');
	rowsLargeInput.id = 'rowsLargeInput';
	rowsLargeInput.style.width = '40 px';
	rowsLargeInput.value = '' + rowsLarge;

	var iconSizeLargeInputLabel = document.createElement('label');
	iconSizeLargeInputLabel.innerText = '🎭 Icon Size:';
	iconSizeLargeInputLabel.title = '🎭 Icon Size';
	var iconSizeLargeInput = document.createElement('input');
	iconSizeLargeInput.id = 'iconSizeLargeInput';
	iconSizeLargeInput.style.width = '40 px';
	iconSizeLargeInput.value = '' + iconSizeLarge;

	var bgInputLabel = document.createElement('label');
	bgInputLabel.innerText = 'Background:';
	bgInputLabel.title = 'Background';
	var bgInput = document.createElement('input');
	bgInput.id = 'bgInput';
	bgInput.style.width = (80 * colsLarge - 40) + 'px';
	bgInput.value = '' + bg;

	var fontSizeInputLabel = document.createElement('label');
	fontSizeInputLabel.innerText = 'Font Size (px):';
	fontSizeInputLabel.title = 'Font Size (px)';
	var fontSizeInput = document.createElement('input');
	fontSizeInput.id = 'fontSizeInput';
	fontSizeInput.style.width = (80 * colsLarge - 40) + 'px';
	fontSizeInput.value = '' + fontSize;

	var submitBtnLabel = document.createElement('label');
	submitBtnLabel.id = 'submitSettingsLabel';
	submitBtnLabel.innerText = 'submit';
	submitBtnLabel.title = 'Apply settings';
	var submitBtn = document.createElement('button');
	submitBtn.id = 'submitSettings';
	submitBtn.innerText = 'OK';
	submitBtn.style.width = (80 * colsLarge - 18) + 'px';
	submitBtn.onclick = function() { changeSettings(); settingsOpened = !settingsOpened; render(); };

	nameInputLabel.appendChild(nameInput);
	colsInputLabel.appendChild(colsInput);
	rowsInputLabel.appendChild(rowsInput);
	iconSizeInputLabel.appendChild(iconSizeInput);
	colsLargeInputLabel.appendChild(colsLargeInput);
	rowsLargeInputLabel.appendChild(rowsLargeInput);
	iconSizeLargeInputLabel.appendChild(iconSizeLargeInput);
	bgInputLabel.appendChild(bgInput);
	fontSizeInputLabel.appendChild(fontSizeInput);
	submitBtnLabel.appendChild(submitBtn);

	settingsDiv.appendChild(nameInputLabel);
	settingsDiv.appendChild(colsInputLabel);
	settingsDiv.appendChild(rowsInputLabel);
	settingsDiv.appendChild(iconSizeInputLabel);
	settingsDiv.appendChild(colsLargeInputLabel);
	settingsDiv.appendChild(rowsLargeInputLabel);
	settingsDiv.appendChild(iconSizeLargeInputLabel);
	settingsDiv.appendChild(bgInputLabel);
	settingsDiv.appendChild(fontSizeInputLabel);
	settingsDiv.appendChild(submitBtnLabel);

	return settingsDiv;
}

// -------------------- App Events ----------------------

function runApp(path) {
	System.Shell.execute(path);
}

function selectApp(selectedIndex) {
	var appsList = apps.children;
	for (var i = 0; i < appsList.length; i++) {
		if (i === selectedIndex) {
			if (appsList[i].className === 'app') {
				appsList[i].className = 'app selected';
				selected = selectedIndex;
			} else {
				appsList[i].className = 'app';
				selected = null;
			}
			continue;
		}
		appsList[i].className = 'app';
	}
}

function delApp() {
	// 1. read
	var lines = readFile(appsFile);

	// 2. write
	var selectedLine = null;
	var file = fs.OpenTextFile(appsFile, 2);
	for (var i = 0; i < lines.length; i++) {
		if (i !== selected) {
			file.WriteLine(lines[i]);
		} else {
			selectedLine = lines[i];
		}
	}
	file.Close();

	// 3. create shortcut
	if (selectedLine.split('@')[2] != undefined) {
		return;
	}
	var name = selectedLine.split('@')[0];
	var path = selectedLine.split('@')[1];
	var shortcut = shell.CreateShortcut('C:\\Users\\AlChi\\Desktop\\' + name + '.lnk');
	shortcut.TargetPath = path;
	shortcut.Save();
}

function changeSettings() {
	if (
		nameInput.value === '' ||
		rowsInput.value === '' || rowsInput.value < 1 || rowsInput.value > 100 ||
		colsInput.value === '' || colsInput.value < 1 || colsInput.value > 100 ||
		iconSizeInput.value === '' || iconSizeInput.value < 1 || iconSizeInput.value > 512 ||
		rowsLargeInput.value === '' || rowsLargeInput.value < 1 || rowsLargeInput.value > 100 ||
		colsLargeInput.value === '' || colsLargeInput.value < 1 || colsLargeInput.value > 100 ||
		iconSizeLargeInput.value === '' || iconSizeLargeInput.value < 1 || iconSizeLargeInput.value > 512 ||
		bgInput.value === '' ||
		fontSizeInput.value === '' || fontSizeInput.value < 1 || fontSizeInput.value > 100
	) return;

	var file = fs.OpenTextFile(settingsFile, 2);

	file.WriteLine(nameInput.value);
	file.WriteLine(colsInput.value);
	file.WriteLine(rowsInput.value);
	file.WriteLine(iconSizeInput.value);
	file.WriteLine(colsLargeInput.value);
	file.WriteLine(rowsLargeInput.value);
	file.WriteLine(iconSizeLargeInput.value);
	file.WriteLine(bgInput.value);
	file.WriteLine(fontSizeInput.value);

	file.Close();

	name = nameInput.value;
	cols = parseInt(colsInput.value, 10);
	rows = parseInt(rowsInput.value, 10);
	iconSize = parseInt(iconSizeInput.value, 10);
	colsLarge = parseInt(colsLargeInput.value, 10);
	rowsLarge = parseInt(rowsLargeInput.value, 10);
	iconSizeLarge = parseInt(iconSizeLargeInput.value, 10);
	bg = bgInput.value;
	fontSize = parseInt(fontSizeInput.value, 10);
}

function moveBack() {
	if (selected === 0) return;

	// 1. read
	var lines = readFile(appsFile);

	// 2. swap
	var s = lines[selected];
	lines[selected] = lines[selected - 1];
	lines[selected - 1] = s;
	selected -= 1;

	// 2. write
	writeFile(appsFile, lines);

	render();
}

function moveForward() {
	// 1. read
	var lines = readFile(appsFile);

	if (selected === lines.length - 1) return;

	// 2. swap
	var s = lines[selected];
	lines[selected] = lines[selected + 1];
	lines[selected + 1] = s;
	selected += 1;

	// 2. write
	writeFile(appsFile, lines);

 	render();
}

function readFile(path) {
	var lines = new Array();
	var file = fs.OpenTextFile(path, 1);
	for (var i = 0; !file.AtEndOfStream; i++) {
		lines[i] = file.ReadLine();
	}
	file.Close();

	return lines;
}

function writeFile(path, lines) {
	var file = fs.OpenTextFile(path, 2);
	for (var i = 0; i < lines.length; i++) {
		file.WriteLine(lines[i]);
	}
	file.Close();
}
