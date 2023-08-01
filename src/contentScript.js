// const MAX_TRIES = 3;
// console.log('This is a log from the extension!');
//
// const headersBasedOnFirstRequest = {
//     'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//     'Accept-Encoding': 'gzip, deflate, br',
//     'Accept-Language': 'ko,en-US;q=0.9,en;q=0.8',
//     'Cache-Control': 'no-cache',
//     'Pragma': 'no-cache',
//     'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
//     'Sec-Ch-Ua-Mobile': '?0',
//     'Sec-Ch-Ua-Platform': '"macOS"',
//     'Sec-Fetch-Dest': 'document',
//     'Sec-Fetch-Mode': 'navigate',
//     'Sec-Fetch-Site': 'none',
//     'Sec-Fetch-User': '?1',
//     'Upgrade-Insecure-Requests': '1',
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
// };
//
// //.se-media-meta-info-wrap
// async function connectToCafe(tryCount = 0) {
//     if (tryCount > MAX_TRIES) {
//         throw new Error('Max attempts reached');
//     }
//
//     await new Promise(resolve => setTimeout(resolve, 300));
//
//     var clubid = '10050146';
//     var articleid = '1001548495';
//     var currentUrl = `https://cc.naver.com/cc?a=gnr_title&r=&i=&bw=860&px=100&py=200&sx=300&sy=400&m=1&nsc=cafe.mycafe&u=${encodeURIComponent('https://cafe.naver.com/ArticleRead.nhn?clubid=' + clubid + '&page=1&menuid=1&boardtype=L&articleid=' + articleid + '&referrerAllArticles=false')}`;
//
//     const response = await fetch(currentUrl, {
//         method: 'GET',
//         headers: headersBasedOnFirstRequest
//     });
//     if (!response.ok) {
//         throw new Error("Network response was not ok");
//     }
//
//     // id: #spiButton (공유)
//     return new Promise((resolve, reject) => {
//         if (response)
//             resolve(response);
//         else
//             reject(new Error('connection failed'));
//     });
// }
//
// async function getIframe(response) {
//     const text = await response.text();
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(text, "text/html");
//     //console.log(doc);
//     //console.log(doc.querySelector('se-media-meta-info-wrap'));
//
//     const iframe = doc.querySelector('iframe#cafe_main'); // 원하는 iframe 선택
//     console.log(iframe.attributes);
//
//     // iframe이 존재하는지 확인
//     if (!iframe) {
//         console.log('iframe not found');
//     }
//
//     return new Promise((resolve, reject) => {
//         iframe.addEventListener('load', function() {
//             const elementInIframe = iframe.contentDocument.querySelector('.se-media-meta-info-wrap');
//             if (elementInIframe) {
//                 resolve(elementInIframe);
//             } else {
//                 reject(new Error('Element not found in iframe'));
//             }
//         });
//     });
// }
//
//
// connectToCafe()
//     .then(camel => getIframe(camel))
//     .catch(error => console.log(error))
//     .then(targetElement => {
//         if (targetElement == null || targetElement.length == 0) {
//             console.log('target element is null');
//         } else {
//             const button = document.createElement('button');
//             button.innerText = 'My Button';
//             button.onclick = function() {
//                 alert('Button clicked!');
//             };
//
//             targetElement.appendChild(button);
//             console.log('button added');
//         }
//     })
//     .catch(error => console.log(error+"\n동영상이 없습니다"));
//
// chrome.runtime.onMessage.addListener(
//     function(request, sender, sendResponse) {
//         if (request.headers) {
//             console.log("Received headers:", request.headers);
//             // 여기서 헤더를 처리하실 수 있습니다.
//         }
//         sendResponse({status: "Headers received!"});
//     }
// );
//
// /*
// goMenu 함수 복제 -> iframe으로 넘기기
// clickcr 함수 복제
//
// https://cc.naver.com/cc?a=gnr_title&r=&i=&bw=860&px=100&py=200&sx=300&sy=400&m=1&nsc=cafe.mycafe&u=https%3A%2F%2Fcafe.naver.com%2FArticleRead.nhn%3Fclubid%3D27748718%26page%3D1%26menuid%3D1%26boardtype%3DL%26articleid%3D36316%26referrerAllArticles%3Dfalse
//  */