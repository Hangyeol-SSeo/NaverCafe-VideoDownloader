const observer = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            const iframe = getIframe();
            if (iframe) {
                handleIframe(iframe);
                observer.disconnect();
            }
        }
    }
});

function handleIframe(iframe) {
    iframe.addEventListener('load', function() {
        getIframeDocument(iframe)
            .then((iframeDoc) => {
                //console.log(iframeDoc.getElementsByClassName('se-media-meta-info-wrap'));
                for (let targetElement of iframeDoc.getElementsByClassName('se-media-meta-info-wrap')) {
                    const button = createButton();
                    const textElements = targetElement.getElementsByClassName('se-media-meta-info-title-text');
                    if (textElements.length > 0) {
                        // 동영상 제목을 popup.js로 전송
                        //chrome.runtime.sendMessage({videoTitle: textElements[0].textContent});
                        //console.log(textElements[0].textContent);

                        // if (!textElements[0].querySelector('button')) {
                        //     //textElements[0].insertAdjacentElement(button); // 버튼추가
                        //     //console.log('button added');
                        // }
                    }
                }
            })
            .catch(error => console.error(error));
    });
}

// Observer 설정
observer.observe(document.body, { childList: true, subtree: true });
