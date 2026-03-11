import requests
from bs4 import BeautifulSoup

def search_ddg_lite(query):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    url = 'https://lite.duckduckgo.com/lite/'
    data = {'q': query}
    try:
        res = requests.post(url, headers=headers, data=data)
        soup = BeautifulSoup(res.text, 'html.parser')
        results = []
        
        for tr in soup.find_all('tr'):
            td_snippet = tr.find('td', class_='result-snippet')
            if td_snippet:
                snippet = td_snippet.text.strip()
                prev_tr = tr.find_previous_sibling('tr')
                if prev_tr:
                    a = prev_tr.find('a', class_='result-link')
                    if a:
                        title = a.text.strip()
                        url_link = a.get('href')
                        results.append({'title': title, 'url': url_link, 'snippet': snippet})
        return results[:5]
    except Exception as e:
        print(f"Error: {e}")
        return []

if __name__ == '__main__':
    res = search_ddg_lite('"William Tanuwijaya" "BINUS"')
    print(f'Found {len(res)} results')
    for i, r in enumerate(res[:2]):
        print(f"{i+1}. {r['title']} - {r['snippet']}")
