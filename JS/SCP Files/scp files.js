import { scpData, maxSCPNUMBER } from './scp-data.js';
import { detailedScpContent } from './scp-detailed-content.js';

function formatSCPNumber(num) {
    return String(num).padStart(3, '0');
}

function formatText(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

const selector = document.getElementById('series-1');

if (selector) {
    const fragment = document.createDocumentFragment();
    
    for (let i = 1; i <= maxSCPNUMBER; i++) {
        const paddedNum = formatSCPNumber(i);
        const scpId = 'SCP-' + paddedNum;
        const scpTitle = scpData[paddedNum] || '[TITLE UNKNOWN]';

        const option = document.createElement('option');
        option.value = scpId;
        option.textContent = `${scpId} ${scpTitle}`;
        fragment.appendChild(option);
    }

    selector.appendChild(fragment);

    selector.addEventListener('change', (e) => {
        displayFile(e.target.value);
    });

    displayFile(selector.value);
}


export const allowedSCPs = [
    'SCP-003', 'SCP-005', 'SCP-019', 'SCP-040', 'SCP-053', 'SCP-073', 
    'SCP-082', 'SCP-087', 'SCP-096', 'SCP-105', 'SCP-111', 'SCP-173', 'SCP-191', 'SCP-200'
];
const fileDisplay = document.getElementById('file-display');

function displayFile(scpId) {
    if (!scpId) return;
    fileDisplay.innerHTML = '';
    const scpNumPadded = scpId.split('-')[1];
    const scpTitle = scpData[scpNumPadded] || '[TITLE UNAVAILABLE]';

    const data = detailedScpContent[scpId];

    if (allowedSCPs.includes(scpId) && data) {
        const title = scpTitle;

        fileDisplay.innerHTML = `
            <div class="access-granted-message">
                <h2 class="scp-title-bar">
                    ${scpId}: ${title}
                    <img src="../../Media/Images/Classes/${data.objectClass}.png" alt="${data.objectClass} Object Class Icon" class="class-icon">
                </h2>
                <p><strong>Object Class:</strong> <span class="scp-object-class ${data.classType}">${data.objectClass}</span></p>
                <hr class="class-divider">
                <p><strong>Special Containment Procedures:</strong> ${formatText(data.procedures)}</p>
                <hr class="class-divider"> ${formatText(data.description)} </div>
        `;

    } else {

        fileDisplay.innerHTML = `
            <div class="access-denied-message">
                <h2>ACCESS DENIED</h2>
                <p>[LEVEL 5 CLEARANCE REQUIRED]</p>
                <p>File: ${scpId} (${scpTitle})</p>
                <p>Security clearance is insufficient to retrieve this file. Attempting access constitutes a breach of protocol.</p>
            </div>
        `;
    }
}

const overviewSection = document.querySelector('.general-overview');
if (overviewSection) {
    const availableList = document.createElement('p');
    availableList.innerHTML = formatText(`**NOTE:** Detailed research files are currently available for the following subjects: 
        **SCP-003**, **SCP-005**, **SCP-019**, **SCP-040**, **SCP-053**, 
        **SCP-073**, **SCP-082**, **SCP-087**, **SCP-096**, **SCP-105**, 
        **SCP-111**, **SCP-173**, **SCP-191**, and **SCP-200**.`);
    overviewSection.appendChild(availableList);
}