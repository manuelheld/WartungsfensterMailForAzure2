import base64
import urllib.request

url = "https://logo.clearbit.com/zf.com?size=256"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    if response.status == 200:
        base64_logo = base64.b64encode(response.read()).decode('utf-8')
        print(f"data:image/png;base64,{base64_logo}")
    else:
        print("Error downloading logo")
