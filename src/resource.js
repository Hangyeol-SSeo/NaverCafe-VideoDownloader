// TODO: DOM으로 동영상 옆에 다운로드 버튼 나오게 하기

function getIframe() {
    return document.querySelector('iframe#cafe_main');
}

function getIframeDocument(iframe) {
    return new Promise((resolve, reject) => {
        if(iframe) {
            resolve(iframe.contentWindow.document);
        } else {
            reject('Iframe not found.');
        }
    });
}

function createButton() {
    const button = document.createElement('button');
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('icons/download_button.png');

    button.style.marginLeft = "10px"; // 10픽셀의 왼쪽 마진을 추가합니다.
    button.onclick = function () {
        alert('Button clicked!');
    };
    button.appendChild(img);
    return button;
}

function titleMapping() {
    const titleScripts = document.getElementsByClassName('__se_module_data');
    return Array.from(titleScripts).map((titleScript) => {
        const parsedScript = JSON.parse(titleScript.dataset.module);
        const vid = parsedScript.data.vid;
        const title = parsedScript.data.mediaMeta.title;
        return {vid, title};
    });
}

let iframe = getIframe();
if(iframe) {
    iframe.addEventListener('load', function() {
        let doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.addEventListener('DOMContentLoaded', function() {
            const titles = titleMapping();
            console.log(titles);
        });
    });
}

