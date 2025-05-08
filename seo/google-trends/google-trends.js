/**
 * https://trends.google.com/trending
 */
import fs from "fs";

const baseUrl = 'https://trends.google.com/_/TrendsUi/data/batchexecute';
const params = {
    'source-path':'/trending',
    'bl':'boq_trends-boq-servers-frontend_20250430.04_p0',
    'hl':'en-US',
    'rt':'c'
}
const queryString = new URLSearchParams(params).toString();
const url = `${baseUrl}?${queryString}`;

// ID, FR, US
const countryCode = 'ID';
// hours : 4, 24, 48, 168 (7 days)
const startedTrending = 4;
// language: en-US,  en
const language = 'en-US';

const filter = [
    null,
    null,
    countryCode,
    0,
    language,
    startedTrending,
    1
];

const body = [[["i0OFE",JSON.stringify(filter),null,"generic"]]];

const result = await fetch(url, {
    method: 'POST',
    headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'origin': 'https://trends.google.com',
        'referer': 'https://trends.google.com/',
    },
    body: `f.req=${encodeURIComponent(JSON.stringify(body))}`
});

const text = await result.text();

function removeFirst3Last5Lines(text) {
    const lines = text.split('\n'); // split into lines
    const trimmedLines = lines.slice(3, lines.length - 5); // remove first 3 and last 5
    return trimmedLines.join('\n'); // join back into string
}

function parseTrendItem(item) {
    if (!Array.isArray(item) || item.length < 13) {
      return null;
    }
  
    const keyword = item[0] ?? "";
    const languageTarget = item[2] ?? "";
    const timestampArray = item[3];
    const timestamp = Array.isArray(timestampArray) ? timestampArray[0] : null;
    const popularity = item[6] ?? 0;
    const volumePercentage = item[8] ?? 0;
    const relatedSearches = Array.isArray(item[9]) ? item[9] : [];
    const categoryId = Array.isArray(item[10]) ? item[10][0] : 0;
    const trackingData = Array.isArray(item[11]) ? item[11] : [];
    const repeatedKeyword = item[12] ?? "";
  
    return {
      keyword,
      languageTarget,
      timestamp,
      popularity,
      volumePercentage,
      relatedSearches,
      categoryId,
      trackingData,
      repeatedKeyword
    };
  }
  
  function parseTrends(rawData) {
    if (!Array.isArray(rawData) || rawData.length < 3) {
      throw new Error('Invalid data format.');
    }
  
    const type = rawData[0];
    const rpcid = rawData[1];
    let trendsString = rawData[2];
  
    if (typeof trendsString !== 'string') {
      throw new Error('Expected a stringified trends array.');
    }
  
    // STEP 1: Parse the string into array
    let parsedTrends;
    try {
      parsedTrends = JSON.parse(trendsString);
    } catch (err) {
      throw new Error('Failed to parse trends JSON string.');
    }
  
    // STEP 2: parsedTrends should now be an array like [null, [ [item1], [item2], ... ]]
    const trendsArray = Array.isArray(parsedTrends) ? parsedTrends[1] : null;
  
    if (!Array.isArray(trendsArray)) {
      throw new Error('Invalid parsed trends array.');
    }
  
    // STEP 3: parse each trend item
    const trends = trendsArray.map(parseTrendItem).filter(item => item !== null);
  
    return {
      type,
      rpcid,
      trends
    };
}

function parseResponse(text){
    const json = JSON.parse(removeFirst3Last5Lines(text));
    const jsonObject = parseTrends(json[0]);
    return jsonObject;
}
fs.writeFileSync('response.txt', JSON.stringify(parseResponse(text), null, 2));