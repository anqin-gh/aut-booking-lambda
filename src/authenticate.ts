import {JSDOM} from 'jsdom';
import {axiosHttp2} from './clients/axiosClient';
import {AxiosResponse} from 'axios';

const LOGIN_URL =
  'https://wodbuster.com/account/login.aspx?cb=autmadridrio&ReturnUrl=https://autmadridrio.wodbuster.com/user/default.aspx';
const EMAIL = process.env.EMAIL || '';
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || '';

const buildRequestFormFromFirstInputTokens = (
  input: NodeListOf<HTMLInputElement>,
) => {
  const form = new FormData();
  form.append(
    'ctl00$ctl00$body$ctl00',
    'ctl00$ctl00$body$ctl00|ctl00$ctl00$body$body$CtlLogin$CtlAceptar',
  );
  form.append('__ASYNCPOST', 'true');

  input.forEach(element => {
    if (element.type === 'hidden') {
      form.append(element.name, element.value);
    } else if (element.type === 'submit' && element.value !== '') {
      form.append(element.name, element.value);
    } else if (element.type === 'email') {
      form.append(element.name, EMAIL);
    } else if (element.type === 'password') {
      form.append(element.name, EMAIL_PASSWORD);
    }
  });
  return form;
};

const buildRequestFormFromHiddenFields = (input: Record<string, string>) => {
  const form = new FormData();
  form.append(
    'ctl00$ctl00$body$body$CtlConfiar$CtlNoSeguro',
    'ctl00$ctl00$body$ctl00|ctl00$ctl00$body$body$CtlConfiar$CtlNoSeguro',
  );
  form.append('__ASYNCPOST', 'true');
  form.append('ctl00$ctl00$body$body$CtlConfiar$CtlNoSeguro', 'No recordar');

  for (const field in input) {
    form.append(field, input[field]);
  }
  return form;
};

const extractHiddenFieldsFromDocument = (document: Document) => {
  const hiddenFieldRegex = /\|hiddenField\|([^\|]+)\|([^\|]*)\|/g;
  const payload = document.body.innerHTML;
  let match;
  const hiddenFields: Record<string, string> = {};

  // Iterate over all matches
  while ((match = hiddenFieldRegex.exec(payload)) !== null) {
    const fieldName = match[1];
    const fieldValue = match[2];
    hiddenFields[fieldName] = fieldValue;
  }

  return hiddenFields;
};

const extractAuthTokenFromCookieString = (cookieString: string) => {
  const wbAuthRegex = /\.WBAuth=([^;]+);/;
  const match = cookieString.match(wbAuthRegex);

  return {['.WBAuth']: match ? match[1] : ''};
};

const convertAxiosResponseToJsdomDocument = (res: AxiosResponse) => {
  return new JSDOM(res.data).window.document;
};

const authenticate = async () => {
  try {
    const firstPageDocument = await axiosHttp2(LOGIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: LOGIN_URL,
      },
    }).then(convertAxiosResponseToJsdomDocument);

    const firstInputData = firstPageDocument.querySelectorAll('input');
    const firstTokensForm =
      buildRequestFormFromFirstInputTokens(firstInputData);

    const secondPageDocument = await axiosHttp2(LOGIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Referer: LOGIN_URL,
      },
      method: 'POST',
      data: firstTokensForm,
    }).then(convertAxiosResponseToJsdomDocument);

    const hiddenFields = extractHiddenFieldsFromDocument(secondPageDocument);
    const secondTokensForm = buildRequestFormFromHiddenFields(hiddenFields);
    secondTokensForm.append('CSRFToken', firstTokensForm.get('CSRFToken')!);

    const authToken = await axiosHttp2(LOGIN_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        Referer: LOGIN_URL,
      },
      method: 'POST',
      data: secondTokensForm,
    })
      .then(res => res.headers['set-cookie']![0])
      .then(extractAuthTokenFromCookieString);
    return authToken;
  } catch (err) {
    console.error(err);
  }
};

authenticate();
