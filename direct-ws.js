const puppeteer = require('puppeteer');
const http = require('http');

async function getWSEndpoint() {
    return new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json/version', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.webSocketDebuggerUrl);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

(async () => {
    console.log('Getting WS endpoint...');
    
    try {
        const ws = await getWSEndpoint();
        console.log('WS:', ws);
        
        console.log('\nConnecting...');
        const browser = await puppeteer.connect({
            browserWSEndpoint: ws,
            defaultViewport: null
        });
        
        console.log('Connected!');
        const pages = await browser.pages();
        console.log(`Pages: ${pages.length}`);
        
        browser.disconnect();
        console.log('Done!');
        
    } catch (err) {
        console.log('Error:', err.message);
    }
})();