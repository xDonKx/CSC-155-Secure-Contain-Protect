const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function typeTextEffect(elementId, speed) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.getAttribute('data-text'); 
    if (!text) return;

    element.textContent = '';
    element.classList.add('typed'); 
    element.classList.remove('typed-done');

    for (let i = 0; i < text.length; i++) {
        let char = text.charAt(i);
        
        if (elementId === 'line-three' && text.substring(i - 1, i + 1) === ' P') {
            element.innerHTML += '<br>' + char;
        } else {
            element.textContent += char;
        }
        await wait(speed);
    }

    element.classList.remove('typed');
    element.classList.add('typed-done');
}

async function startAnimationSequence() {
    await typeTextEffect('line-one', 35);
    await wait(500);
    await typeTextEffect('line-two', 100);
    await wait(500);
    await typeTextEffect('line-three', 20);

    const accessBtn = document.getElementById('access-button');
    if (accessBtn) {
        accessBtn.style.opacity = '1';
        accessBtn.style.pointerEvents = 'auto';
        accessBtn.addEventListener('click', () => {
            const warning = document.getElementById('warning-screen');
            const login = document.getElementById('login-screen');
            if (warning) { warning.classList.remove('active'); warning.style.display = 'none'; }
            if (login) { login.classList.add('active'); login.style.display = 'block'; }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('access-button');
    if (button) {
        button.style.opacity = '0';
        button.style.pointerEvents = 'none';
    }
    
    startAnimationSequence();
});