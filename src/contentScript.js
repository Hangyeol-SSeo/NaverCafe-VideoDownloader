function getContainer() {
    return document.querySelector('body');
}

function getActiveTabId() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "getActiveTabId" }, (response) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            if (response && response.tabId !== undefined) {
                resolve(response.tabId);
            } else {
                reject("No tab id received.");
            }
        });
    });
}

// 현재 탭의 videoSources 데이터를 storage에서 가져오는 함수
async function getCurrentTabVideoSources() {
    try {
        const tabId = await getActiveTabId();
        const tabKey = String(tabId);
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(tabKey, (result) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(result[tabKey]);
                }
            });
        });
    } catch (error) {
        console.error("Error getting video sources for current tab:", error);
        throw error;
    }
}


function normalizeText(text) {
    return text ? text.replace(/\s+/g, '').trim() : '';
}

function getBestVideoSource(videoList) {
    if (!videoList || videoList.length === 0) return null;
    // 화질 우선순위 정의
    const qualityOrder = ['1080p', '720p', '480p', '360p', '270p'];
    
    for (const quality of qualityOrder) {
        const found = videoList.find(v => v.encodingName === quality);
        if (found) return found;
    }
    // 우선순위에 없으면 첫 번째 것 반환
    return videoList[0];
}

function createButton(titleText) {
    const button = document.createElement('button');
    button.title = "동영상 다운로드";
    Object.assign(button.style, {
        marginLeft: "10px",
        width: "24px",
        height: "24px",
        cursor: "pointer",
        border: "none",
        background: "transparent",
        padding: "0"
    });

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/download_button.png');
    Object.assign(img.style, {
        width: "24px",
        height: "24px",
        display: "block"
    });

    button.classList.add('download-btn');
    
    button.onclick = async function (e) {
        e.preventDefault();
        e.stopPropagation();

        try {
            const videoSources = await getCurrentTabVideoSources();
            if (!videoSources || videoSources.length === 0) {
                alert("다운로드할 동영상 정보를 찾을 수 없습니다. 영상을 재생한 후 다시 시도해주세요.");
                return;
            }

            console.log("Searching for title:", titleText);
            console.log("Available sources:", videoSources);

            // 제목으로 매칭 시도
            const cleanTitle = normalizeText(titleText);
            let targetVideo = videoSources.find(source => normalizeText(source.subject) === cleanTitle);
            
            // 제목 매칭 실패 시, 소스가 하나뿐이면 그 소스를 사용 (일반적인 경우)
            if (!targetVideo && videoSources.length === 1) {
                targetVideo = videoSources[0];
            }

            if (targetVideo) {
                const bestSource = getBestVideoSource(targetVideo.videos);
                if (bestSource) {
                    // 화면에 보이는 제목(titleText)을 우선 사용, 없으면 API 제목 사용
                    let rawTitle = titleText && titleText.trim() ? titleText.trim() : targetVideo.subject;
                    // 파일명으로 쓸 수 없는 문자 제거 (/, :, *, ?, ", <, >, |)
                    rawTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "_");
                    
                    const filename = (rawTitle || "video") + ".mp4";
                    chrome.runtime.sendMessage({
                        action: "download",
                        url: bestSource.source,
                        filename: filename
                    }, (response) => {
                        if (response && response.success) {
                           // 다운로드 시작 성공
                        } else {
                           alert("다운로드 시작 실패: " + (response ? response.error : "Unknown error"));
                        }
                    });
                } else {
                    alert("사용 가능한 비디오 소스가 없습니다.");
                }
            } else {
                alert("일치하는 동영상을 찾을 수 없습니다. (제목 불일치)");
            }

        } catch (error) {
            console.error("Failed to retrieve video sources:", error);
            alert("오류가 발생했습니다: " + error);
        }
    };
    button.appendChild(img);
    return button;
}


function insertButtons(doc) {
    const titleTexts = doc.querySelectorAll('.se-media-meta-info-title-text');
    titleTexts.forEach(titleElement => {
        // 이미 버튼이 있는지 확인 (바로 다음 형제 요소)
        const next = titleElement.nextElementSibling;
        if (next && next.classList.contains('download-btn')) {
            return;
        }

        // 버튼 생성 및 삽입
        const button = createButton(titleElement.textContent);
        
        // 타이틀이 inline 요소라면 바로 옆에 잘 붙겠지만, 
        // 부모의 정렬 문제가 있을 수 있음. 필요시 부모 스타일 조정.
        const parent = titleElement.parentElement;
        if (parent) {
            parent.style.display = "flex";
            parent.style.alignItems = "center";
        }

        titleElement.insertAdjacentElement('afterend', button);
        console.log('Button inserted next to title:', titleElement.textContent);
    });
}


function handleContent() {
    const body = document.body;
    if (!body) return;

    insertButtons(document);

    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                insertButtons(document);
            }
        }
    });
    observer.observe(body, { childList: true, subtree: true });
}

// 초기 실행 및 주기적 확인 (SPA 대응)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleContent);
} else {
    handleContent();
}

// 혹시 모를 로딩 지연에 대비하여 주기적으로 체크
setInterval(() => {
    insertButtons(document);
}, 2000);
