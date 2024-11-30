import axios from 'axios';
import http2 from 'http2-wrapper';
import {createHTTP2Adapter} from 'axios-http2-adapter';
import {JSDOM} from 'jsdom';

const LOGIN_URL = 'https://wodbuster.com/account/login.aspx';

const http2Adapter = createHTTP2Adapter({
  agent: new http2.Agent(),
  force: true,
});

const axiosHttp2 = axios.create({
  adapter: http2Adapter,
});

axiosHttp2(LOGIN_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0',
    Referer: LOGIN_URL,
  },
})
  .then(res => {
    console.info(res.data);
    return res.data;
  })
  .then(data => new JSDOM(data))
  .then(dom => {
    const csrfToken =
      dom.window.document.querySelector<HTMLInputElement>(
        "[name='CSRFToken']",
      )?.value;
    const viewStatec = dom.window.document.querySelector<HTMLInputElement>(
      "[name='__VIEWSTATEC']",
    )?.value;

    console.info(csrfToken, viewStatec);
  });
