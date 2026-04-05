import { ALERT_MAPPING } from './alerts.js';

const terminalScreen = document.getElementById('terminal-screen');
const mainContent = document.getElementById('main-content');
const serverTimeEl = document.getElementById('server-time');
const siteStatusEl = document.getElementById('site-status');
const lockdownScreen = document.getElementById('lockdown-screen');
const amnesticTimerEl = document.getElementById('amnestic-timer');
const notificationIcon = document.getElementById('notification-icon');
const alertCountEl = document.getElementById('alert-count');
const alertDropdown = document.getElementById('alert-dropdown');
const alertList = document.getElementById('alert-list');
const noAlertsMsg = document.getElementById('no-alerts-msg');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const toastNotification = document.getElementById('toast-notification');

let timeUpdateInterval;
let breachInterval;
let unreadAlertCount = 0;
let availableAlerts = [];
let isBreachActive = false;
let isAlertCycleRunning = false;
let activeYellowEvents = 0;

// Used AI here to debug and get the terminalScreen working properly. 
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function scrollToBottom() {
    if (!terminalScreen) return;
    terminalScreen.scrollTop = terminalScreen.scrollHeight;
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

async function runBootSequence() {
    const terminalOutput = document.getElementById('terminal-output');
    if (!terminalOutput) return;

    terminalOutput.innerHTML = '';
    const lines = [
        { text: "ESTABLISHING CONNECTION TO SECURE_SERVER_SITE-7", type: "loading" },
        { text: "ACCESS <span class='status-granted'>GRANTED</span>", type: "html" },
        { text: " ", type: "white" },
        { text: "CONNECTING TO AUTH SERVERS", type: "loading" },
        { text: "CHECKING LEVEL 1 SECURITY CLEARANCE: <span class='status-granted'>GRANTED</span>", type: "html" },
        { text: "CHECKING LEVEL 2 SECURITY CLEARANCE: <span class='status-granted'>GRANTED</span>", type: "html" },
        { text: "CHECKING LEVEL 3 SECURITY CLEARANCE: <span class='status-denied'>DENIED</span>", type: "html" },
        { text: "CREDENTIALS <span class='status-granted'>VERIFIED</span>", type: "html" },
        { text: "TERMINAL READY. INITIALIZING DATABASE", type: "loading" }
    ];

    for (const line of lines) {
        const p = document.createElement('p');
        p.className = 'terminal-line';
        terminalOutput.appendChild(p);

        if (line.type === "loading") {
            p.textContent = line.text;
            for (let i = 0; i < 30; i++) {
                await wait(Math.random() * 100 + 75);
                p.textContent += ".";
                scrollToBottom();
            }
            await wait(1000);
        } else if (line.type === "html") {
            p.innerHTML = line.text;
            scrollToBottom();
            await wait(1000);
        } else {
            p.textContent = line.text;
            scrollToBottom();
            await wait(Math.random() * 1200 + 800);
        }
    }

    await wait(1000);
    enterDashboard();
}

// Used the help of AI to convert my local.storage logic to session cookie logic and resist on page refresh. 
function enterDashboard() {
    if (terminalScreen) terminalScreen.style.opacity = '0';
    document.cookie = "hasBooted=true; path=/; SameSite=Strict";
    document.documentElement.classList.add('has-booted'); 

    setTimeout(() => {
        if (terminalScreen) terminalScreen.style.display = 'none';
        if (mainContent) {
        mainContent.classList.remove('hidden');
        mainContent.style.display = 'block';
        mainContent.style.opacity = '1';
        }
        initializePage();
    }, 500);
}

const CONTAINMENT_BREACH_CHANCE = 0.05; //breach chance

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function formatAlertText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function replenishAlerts() {
    availableAlerts = Object.keys(ALERT_MAPPING);
    shuffleArray(availableAlerts);
}

function saveAppState() {
    if (!alertList || !siteStatusEl) return;

    const currentAlerts = Array.from(alertList.querySelectorAll('li')).map(li => ({
        html: li.innerHTML
    }));

    const appState = {
        alertMessages: currentAlerts,
        unreadCount: unreadAlertCount,
        isBreach: isBreachActive
    };
    sessionStorage.setItem('scpAppState', JSON.stringify(appState));
}

function loadAppState() {
    const savedState = sessionStorage.getItem('scpAppState');
    if (!savedState) return;

    const state = JSON.parse(savedState);

    if (state.alertMessages && alertList) {
        alertList.innerHTML = '';
        [...state.alertMessages].reverse().forEach(alertObj => {
            const listItem = document.createElement('li');
            listItem.innerHTML = alertObj.html;
            alertList.prepend(listItem);
        });

        if (state.alertMessages.length > 0 && noAlertsMsg) {
            noAlertsMsg.classList.add('hidden');
        }
    }

    unreadAlertCount = state.unreadCount || 0;
    if (alertCountEl) {
        alertCountEl.textContent = unreadAlertCount;
        if (unreadAlertCount > 0) {
            alertCountEl.classList.remove('hidden');
        } else {
            alertCountEl.classList.add('hidden');
        }
    }

    activeYellowEvents = 0;

    isBreachActive = state.isBreach || false;
    if (isBreachActive) {
        const breachExpiry = sessionStorage.getItem('breachExpiry');
        const remaining = breachExpiry ? parseInt(breachExpiry) - Date.now() : 5000;
        setTimeout(startLockdownCountdown, Math.max(remaining, 0));
    }

    if (siteStatusEl) {
        updateSiteStatus();
    }
}

function updateTime() {
    const now = new Date();
    const date = now.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (serverTimeEl) {
        serverTimeEl.textContent = `${date} ${time}`;
    }
}

function showToastNotification(message) {
    if (toastNotification) {
        let displayMessage = message.replace(/\*\*/g, '');
        toastNotification.textContent = displayMessage;
        toastNotification.classList.remove('hidden');
        toastNotification.classList.add('active');

        setTimeout(() => {
            toastNotification.classList.remove('active');
            setTimeout(() => {
                toastNotification.classList.add('hidden');
            }, 500);
        }, 5000);
    }
}

function logAlert(message) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (alertList) {
        const listItem = document.createElement('li');
        listItem.innerHTML = `<strong>[${time}]</strong> ${formatAlertText(message)}`;
        alertList.prepend(listItem);

        if (noAlertsMsg) noAlertsMsg.classList.add('hidden');

        while (alertList.children.length > 50) alertList.lastChild.remove();

        unreadAlertCount++;
        if (alertCountEl) {
            alertCountEl.textContent = unreadAlertCount;
            alertCountEl.classList.remove('hidden');
        }
        saveAppState();
    }
    showToastNotification(message);
}

function startLockdownCountdown() {
    clearInterval(breachInterval);
    clearInterval(timeUpdateInterval);

    if (lockdownScreen) {
        lockdownScreen.classList.remove('hidden');
        lockdownScreen.style.display = 'flex';
    }

    if (mainContent) {
        mainContent.classList.add('hidden');
    }

    if (menuToggle) {
        menuToggle.classList.add('hidden');
    }

    document.body.style.overflow = 'hidden';
    let countdownValue = 10;

    if (amnesticTimerEl) amnesticTimerEl.textContent = countdownValue;

    const countdownInterval = setInterval(() => {
        countdownValue--;

        if (countdownValue > 0) {
            if (amnesticTimerEl) amnesticTimerEl.textContent = countdownValue;
        } else if (countdownValue === 0) {
            if (amnesticTimerEl) amnesticTimerEl.textContent = 'EXECUTING';
        } else {
            clearInterval(countdownInterval);
            sessionStorage.removeItem('scpAppState');
            document.cookie = "hasBooted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.replace('404.html');
        }
    }, 1000);
}

function updateSiteStatus() {
    if (!siteStatusEl) return;

    siteStatusEl.classList.remove('status-yellow', 'status-green', 'status-red');

    if (isBreachActive) {
        siteStatusEl.textContent = "SITE-██ STATUS: RED - CONTAINMENT BREACH";
        siteStatusEl.classList.add('status-red');
    } else if (activeYellowEvents > 0) {
        siteStatusEl.textContent = `SITE-██ STATUS: YELLOW - HIGH CAUTION - ${activeYellowEvents} ACTIVE OPERATIONS`;
        siteStatusEl.classList.add('status-yellow');
    } else {
        siteStatusEl.textContent = "SITE-██ STATUS: GREEN";
        siteStatusEl.classList.add('status-green');
    }
}

function triggerBreach() {
    if (isBreachActive) return;
    isBreachActive = true;
    updateSiteStatus();

    logAlert("⚠️ **CRITICAL ALERT:** KETER - CLASS CONTAINMENT BREACH DETECTED. ALL PERSONNEL REPORT TO NEAREST EVACUATION BUNKER.");

    const breachExpiry = Date.now() + 60000;
    sessionStorage.setItem('breachExpiry', breachExpiry);
    saveAppState();

    setTimeout(startLockdownCountdown, 60000);
}

//Used AI to help replace message logic from just 1 message then the next to dynamic messages overlapping.
function runAlertCycle() {
    if (isBreachActive || isAlertCycleRunning) {
        isAlertCycleRunning = false;
        return;
    }
    isAlertCycleRunning = true;
    if (availableAlerts.length === 0) replenishAlerts();

    const actionMessage = availableAlerts.pop();
    const completionMessage = ALERT_MAPPING[actionMessage];

    const upperMsg = actionMessage.toUpperCase();
    const isYellowAlert = upperMsg.includes("TRANSFER") ||
        upperMsg.includes("TRANSIT") ||
        upperMsg.includes("MAINTENANCE") ||
        upperMsg.includes("ALERT") ||
        upperMsg.includes("MTF");

    if (isYellowAlert) activeYellowEvents++;
    logAlert(actionMessage);
    updateSiteStatus();

    if (completionMessage) {
        const completionDelay = Math.floor(Math.random() * 30000) + 15000;

        setTimeout(() => {
            if (!isBreachActive) {
                if (isYellowAlert) activeYellowEvents--;
                logAlert(completionMessage);
                updateSiteStatus();
            }
        }, completionDelay);
    }

    const nextAlertDelay = Math.floor(Math.random() * 60000) + 45000;
    isAlertCycleRunning = false;
    setTimeout(runAlertCycle, nextAlertDelay);
}

function runBreachCycle() {
    if (isBreachActive) return;
    if (Math.random() < CONTAINMENT_BREACH_CHANCE) {
        triggerBreach();
    }
}

function initializePage() {
    loadAppState();

    if (!timeUpdateInterval) {
        timeUpdateInterval = setInterval(updateTime, 1000);
        updateTime();
    }

    if (!isBreachActive) {

        if (!breachInterval) {
            runAlertCycle();
            breachInterval = setInterval(runBreachCycle, 60000);
        }
    }

    if (menuToggle) {
        menuToggle.classList.remove('hidden');
    }
    if (menuToggle && sidebar) {
        menuToggle.onclick = () => sidebar.classList.toggle('open');
    }

    if (notificationIcon && alertDropdown) {
        notificationIcon.onclick = () => {
            alertDropdown.classList.toggle('hidden');
            if (!alertDropdown.classList.contains('hidden')) {
                unreadAlertCount = 0;
                if (alertCountEl) alertCountEl.classList.add('hidden');
                saveAppState();
            }
        };
    }
}

replenishAlerts();

const alreadyBooted = 
    getCookie('hasBooted') === 'true' || 
    document.documentElement.classList.contains('has-booted');

document.addEventListener('DOMContentLoaded', () => {
    if (alreadyBooted) {
        if (terminalScreen) {
            terminalScreen.style.display = 'none';
            terminalScreen.style.opacity = '0';
        }
        if (mainContent) {
            mainContent.classList.remove('hidden');
            mainContent.style.display = 'block';
            mainContent.style.opacity = '1';
        }
        initializePage();
    } else if (terminalScreen) {
        const terminalOutput = document.getElementById('terminal-output');
        if (terminalOutput) {
            terminalOutput.innerHTML = '<p>CLICK OR PRESS ANY KEY TO INITIALIZE...</p>';
        }

        const startSequence = () => {
            runBootSequence();
            document.removeEventListener('keydown', startSequence);
        };

        terminalScreen.addEventListener('click', startSequence, { once: true });
        document.addEventListener('keydown', startSequence, { once: true });
    } else {
        initializePage();
    }
});