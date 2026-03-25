const https = require('https');
const fs = require('fs');

const options = {
  hostname: 'upload.wikimedia.org',
  path: '/wikipedia/commons/thumb/9/94/ZF_logo_STD_Blue_3CC.svg/250px-ZF_logo_STD_Blue_3CC.svg.png',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  }
};

https.get(options, (resp) => {
  let data = [];
  resp.on('data', (chunk) => data.push(chunk));
  resp.on('end', () => {
    let buffer = Buffer.concat(data);
    let b64 = buffer.toString('base64');
    fs.writeFileSync('src/services/zfLogoBase64.ts', 'export const zfLogoBase64 = "' + b64 + '";\n');
    console.log('Done downloading. Base64 length:', b64.length);
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
