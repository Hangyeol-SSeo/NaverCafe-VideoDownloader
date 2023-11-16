// TODO: DOM으로 동영상 옆에 다운로드 버튼 나오게 하기

function getIframe() {
    const iframe = document.querySelector('iframe#cafe_main');
    return iframe;
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
    //img.src = chrome.runtime.getURL('icons/download_button.png');

    button.style.marginLeft = "10px"; // 10픽셀의 왼쪽 마진을 추가합니다.
    button.onclick = function () {
        alert('Button clicked!');
    };
    //button.appendChild(img);
    return button;
}

