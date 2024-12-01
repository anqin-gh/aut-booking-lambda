import axios from 'axios';
import http2 from 'http2-wrapper';
import {createHTTP2Adapter} from 'axios-http2-adapter';

const http2Adapter = createHTTP2Adapter({
  agent: new http2.Agent(),
  force: true,
});

export const axiosHttp2 = axios.create({
  adapter: http2Adapter,
});
