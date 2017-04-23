
var user = {
	name: "",
	icon: "guy1.png",
	lang: {
		"language": "en",
		"name": "English"
	}
}

var languageChanged = false, iconChanged = false, nameChanged = false;

var userList = [];

var socket = io();

var shouldScroll = true, shouldTranslate = false;

var CHAT_NORMAL = 0, CHAT_SPECIAL = 1;

var digits = "0123456789";

var helpText = "Welcome to WorldChat! Here are some special commands you can send:<br /><br />" +
			   "<table>" +
			   "<tr><td>/help</td><td>- display this help message</td></tr>" +
			   "<tr><td>/sit</td><td>- perform the sit emote</td></tr>" + 
			   "<tr><td>/laugh</td><td>- perform the laugh emote</td></tr>" + 
			   "<tr><td>/yawn</td><td>- perform the yawn emote</td></tr>" + 
			   "<tr><td>/hide</td><td>- perform the hide emote</td></tr>" + 
			   "<tr><td>/scream</td><td>- perform the scream emote</td></tr>" +
			   "</table>";

function randBetween(min, max) {
	min = Math.ceil(min);
  	max = Math.floor(max);
  	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName() {
	var name = "user";
	for(var i = 0; i < 5; i++) {
		name += digits[randBetween(0, digits.length - 1)];
	}

	return name;
}

function generateIcon() {
	var gender = randBetween(1, 10);
	if(gender <= 5) {
		// male
		return "guy" + randBetween(1, 2) + ".png";
	} else {
		// female 
		return "girl" + randBetween(1, 2) + ".png";
	}
}

user.name = generateName();
user.icon = generateIcon();
socket.emit('connect-data', JSON.stringify(user));

function postChat() {
	var chatInput = document.getElementsByClassName('chat-input')[0];
	if(chatInput.value.trim().length == 0) return;

	var content = chatInput.value.trim();
	var timestamp = new Date();

	var proceed = checkForSpecialMessage(content);
	if(!proceed) {
		chatInput.value = "";
		return;
	}

	var msg = {
		content: content,
		ts: timestamp,
		icon: user.icon,
		name: user.name,
		lang: user.lang.language,
		type: (content[0] == "/" ? CHAT_SPECIAL : CHAT_NORMAL)
	}

	socket.emit('msg', JSON.stringify(msg));
	chatInput.value = "";
}

function checkForSpecialMessage(msg) {
	var trimmed = msg.trim();
	var proceed = true;
	if(trimmed == "/help") {
		var msg = {
			content: helpText,
			ts: new Date(),
			icon: "robot.png",
			name: "HelpBot",
			type: CHAT_NORMAL
		}

		updateChatUI(JSON.stringify(msg));

		proceed = false;
	} 

	return proceed;
}

socket.on('msg', function(msg) {
	var data = JSON.parse(msg);
	console.log(shouldTranslate, data.lang, user.lang.language);
	if(shouldTranslate && data.lang != user.lang.language) {
		//https://translation.googleapis.com/language/translate/v2?key=YOUR_API_KEY&source=en&target=de&q=Hello%20world&q=My%20name%20is%20Jeff
		var textString = data.content.replaceAll(' ', '%20');
		var queryURL = 'https://translation.googleapis.com/language/translate/v2?key=AIzaSyAOaVDkmKY6a3tabp1NEZI1TMU9KyiAmMM&source=' + data.lang + "&target=" + user.lang.language + "&q=" + textString;

		console.log("Text: " + textString);
		console.log("Query: " + queryURL);

		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if(this.readyState == 4 && this.status == 200) {
				var resp = JSON.parse(xhr.responseText);
				data.content = resp.data.translations[0].translatedText;
				updateChatUI(JSON.stringify(data));
			}
		}
		xhr.open('GET', queryURL, true);
		xhr.send();
	} else {
		updateChatUI(msg);
	}
});

socket.on('special', function(msg) {
	generateSpecialMessage(msg);
});

socket.on('icon-change', function(data) {
	var usernameList = document.body.querySelectorAll('.user-name-display');
	var uiIconList = document.body.querySelectorAll('.user-icon');
	var changedUser = JSON.parse(data);

	console.log(usernameList, uiIconList);

	for(var i = 0; i < usernameList.length; i++) {
		console.log(usernameList[i].textContent, changedUser.name)
		if(usernameList[i].textContent == changedUser.name) {
			uiIconList[i].src = "../assets/" + changedUser.icon;
		}
	}
});

socket.on('name-change', function(data) {
	var data = JSON.parse(data);
	var usernameList = document.body.querySelectorAll('.user-name-display');

	for(var i = 0; i < usernameList.length; i++) {
		if(usernameList[i].textContent == data.old) {
			usernameList[i].textContent = data.new;
		}
	}

	if(data.old == user.name) user.name = data.new;
});

function updateChatUI(msg) {
	var data = JSON.parse(msg);
	var chatArea = document.getElementsByClassName('chat-area')[0];

	var chatBoxContainer = document.createElement('div');
	chatBoxContainer.className = "chat-box-container";

	var chatBox = document.createElement('div');
	chatBox.className = "chat-box" + ((data.name == user.name) ? " chat-box-own" : "");
	chatBoxContainer.appendChild(chatBox);

	var chatTextBox = document.createElement('div');
	chatTextBox.className = "chat-text-box";
	chatBox.appendChild(chatTextBox);

	var chatMetadataBox = document.createElement('div');
	chatMetadataBox.className = "chat-metadata-box";
	chatTextBox.appendChild(chatMetadataBox);

	var chatTime = document.createElement('p');
	chatTime.className = "chat-time";

	var ts = new Date(data.ts);
	var timeString = ts.toTimeString();
	chatTime.textContent = ts.toDateString() + " @ " + timeString.substr(0, timeString.indexOf(' '));
	chatMetadataBox.appendChild(chatTime);

	var userNameDisplay = document.createElement('p');
	userNameDisplay.className = "user-name-display";
	userNameDisplay.textContent = data.name;
	chatMetadataBox.appendChild(userNameDisplay);

	var chatDivider = document.createElement('hr');
	chatDivider.className = "chat-divider";
	chatMetadataBox.appendChild(chatDivider);

	var chatContentBox = document.createElement('div');
	chatContentBox.className = "chat-content-box";
	chatTextBox.appendChild(chatContentBox);

	var chatContentText = document.createElement('p');
	chatContentText.className = "chat-content-text";
	if(data.name == "HelpBot") {
		chatContentText.innerHTML = data.content;
	} else {
		chatContentText.textContent = data.content;	
	}
	chatContentBox.appendChild(chatContentText);

	var userIcon = document.createElement('img');
	userIcon.setAttribute('alt', 'User Icon');
	userIcon.className = "user-icon";
	userIcon.src = "../assets/" + data.icon;
	chatBox.appendChild(userIcon);

	chatArea.appendChild(chatBoxContainer);

	scrollChat();
}

function scrollChat() {
	var chatArea = document.getElementsByClassName('chat-area')[0];

	var scrollFactor = 10;
	var diff = chatArea.scrollHeight - chatArea.scrollTop;
	if(shouldScroll && diff > 0) {
		chatArea.scrollTop = chatArea.scrollHeight;
	}
}

function checkForSend(e) {
	var keynum;

    if(window.event) { // IE                    
      keynum = e.keyCode;
    } else if(e.which){ // Netscape/Firefox/Opera                   
      keynum = e.which;
    }

    /* if enter key was pressed */
   	if(keynum == 13) {
   		shouldScroll = true;
   		postChat();
   	}
}

function setScroll() {
	var chatArea = document.getElementsByClassName('chat-area')[0];
	var scrollBarHeight = chatArea.scrollHeight * (chatArea.offsetHeight / chatArea.scrollHeight)

	if(chatArea.scrollTop + scrollBarHeight < chatArea.scrollHeight) {
		shouldScroll = false;
	} else {
		shouldScroll = true;
	}
}

function generateSpecialMessage(msg) {
	if(msg.indexOf("connected") != -1) {
		var username = msg.substring(msg.indexOf('>') + 1, msg.indexOf('</'));
		if(username == user.name) return;
		else {
			userList.push(username);
		}
	} else if(msg.indexOf("disconnected") != -1) {
		var username = msg.substring(msg.indexOf('>') + 1, msg.indexOf('</'));
		if(username == user.name) return;
		else {
			for(var i = 0; i < userList.length; i++) {
				if(userList[i] == username) {
					userList.splice(i, 1);
					break;
				}
			}
		}
	}

	var chatArea = document.getElementsByClassName('chat-area')[0];

	var chatBoxContainer = document.createElement('div');
	chatBoxContainer.className = "chat-box-container";

	var specialMessage = document.createElement('p');
	specialMessage.className = "special-message";
	specialMessage.innerHTML = msg;

	chatBoxContainer.appendChild(specialMessage);
	chatArea.appendChild(chatBoxContainer);

	scrollChat();
}

function openSettings() {
	var overlay = document.getElementsByClassName('overlay')[0];
	var settingsWindow = document.getElementsByClassName('settings-window')[0];

	overlay.style.display = "block";
	settingsWindow.style.display = "block";

	document.getElementsByClassName('username-input')[0].value = user.name;
	var iconList = document.getElementsByClassName('icon-list')[0];
	var icons = iconList.querySelectorAll('img');

	selectedIcon = user.icon;

	for(var i = 0; i < icons.length; i++) {
		if(icons[i].getAttribute('data-icon-name') == user.icon) {
			icons[i].parentNode.style.borderColor = "#48b19b";
		} else {
			icons[i].parentNode.style.borderColor = "transparent";
		}
	}

	setTimeout(function() {
		overlay.style.opacity = 1;
		settingsWindow.style.opacity = 1;
	}, 0);
}

function selectIcon(elem) {
	var iconList = document.getElementsByClassName('icon-list')[0];
	var icons = iconList.querySelectorAll('img');

	for(var i = 0; i < icons.length; i++) {
		if(icons[i].getAttribute('data-icon-name') == elem.getAttribute('data-icon-name')) {
			icons[i].parentNode.style.borderColor = "#48b19b";
		} else {
			icons[i].parentNode.style.borderColor = "transparent";
		}
	}

	selectedIcon = elem.getAttribute('data-icon-name');
}

function selectLanguage(elem) {
	var languageSelect = elem;
	if(elem.value != user.lang.language) {
		for(var i = 0; i < supportedLanguages.length; i++) {
			if(supportedLanguages[i].language == elem.value) {
				user.lang = supportedLanguages[i];
				languageChanged = true;
				break;
			}
		}
	}
}

function applySettings() {
	if(selectedIcon != user.icon) {
		user.icon = selectedIcon;
		iconChanged = true;
		socket.emit('icon-change', selectedIcon);
	}

	var username = document.getElementsByClassName('username-input')[0].value;
	if(username != user.name) {
		if(userList.indexOf(username) != -1 || username == "HelpBot") {
			document.getElementsByClassName('error-text')[0].style.display = "inline";
		} else {
			nameChanged = true;
			socket.emit('name-change', JSON.stringify({old: user.name, new: username}));
			closeSettings();
		}
	} else {
		closeSettings();
	}

	if(iconChanged) {
		if(user.icon == "girl1.png" || user.icon == "girl2.png") {
			generateSpecialMessage("You have successfully changed your icon. You are now a pretty girl!")
		} else {
			generateSpecialMessage("You have successfully changed your icon. You are now a strapping young lad.");
		}
		iconChanged = false;
	}

	if(nameChanged) {
		generateSpecialMessage("Who once was <span style=\"color: #48b19b;\">" + user.name + "</span> shall now be known to the world as <span style=\"color: #48b19b;\">" + username + "</span>!<br />Go! Embrace your new identity! Everyone is waiting!");
		nameChanged = false;
	}

	if(languageChanged) {
		generateSpecialMessage("You have selected '" + user.lang.name + "' as your spoken language.<br />All incoming messages will be translated to match your selection.");
		languageChanged = false;
	}
}

function closeSettings() {
	var overlay = document.getElementsByClassName('overlay')[0];
	var settingsWindow = document.getElementsByClassName('settings-window')[0];

	settingsWindow.style.opacity = 0;
	overlay.style.opacity = 0;

	setTimeout(function() {
		settingsWindow.style.display = "none";
		overlay.style.display = "none";
	}, 350);
}

function generateLanguageSelections() {
	var languageSelect = document.getElementsByClassName('language-select')[0];
	for(var i = 0; i < supportedLanguages.length; i++) {
		var lang = supportedLanguages[i];

		var opt = document.createElement('option');
		opt.setAttribute('value', lang.language);
		if(lang.language == "en")
			opt.setAttribute('selected', 'selected');
		opt.textContent = lang.name;

		languageSelect.appendChild(opt);
	}
}

function toggleTranslate(elem) {
	shouldTranslate = elem.checked;

	var label = document.getElementById('lang-label');
	var languageSelect = document.getElementsByClassName('language-select')[0];

	if(elem.checked) {
		label.style.filter = "none";
		languageSelect.disabled = false;
		languageSelect.style.filter = "none";
		languageSelect.style.borderRadius = "0px";
	} else {
		label.style.filter = "grayscale(100%)";
		languageSelect.disabled = true;
		languageSelect.style.filter = "blur(10px)";
		languageSelect.style.borderRadius = "20px";
	}
}

window.onload = function() {
	generateSpecialMessage("Welcome to WorldChat, <span style=\"color: #48b19b\">" + user.name + "</span>!");

	generateLanguageSelections();
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
