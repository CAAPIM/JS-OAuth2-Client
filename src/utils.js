/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/
const SUCCESS = 0;
const ERROR = -1;
const TOKEN_ERROR = {
  httpStatus:0,
  errorCode:-1001,
  errMsg:'Token Error'
};
const INTERNAL_ERROR = {
  httpStatus:0,
  errorCode:-1002,
  errMsg:'xhrUtil: XMLHttpRequest not supported'
};
const CRYPTO_ERROR = {
  httpStatus:0,
  errorCode:-1003,
  errMsg:'Crypto Error'
};
const network_errCode = -1004;
const server_errCode = -1005;
const invalid_cred_errCode = -1006;
const api_not_found_errCode = -1007;
const bad_request_errCode = -1008;

let NETWORK_ERROR;
let SERVER_ERROR;
let INVALID_CREDENTIALS;
let API_NOT_FOUND;
let BAD_REQUEST;
/**********  Utility Functions  **************/
// util for creating XHRRequests
function xhrUtil(url,method,headers,profileId,data)
{
  return new Promise((resolve, reject) => {
    let xhttp;
    try
    {
      xhttp = new XMLHttpRequest();
    }
    catch (e)
    {
      try
      {
        xhttp = new ActiveXObject('Msxml2.XMLHTTP');
      }
      catch (e)
      {
        if (console)
        {
          debug.info('xhrUtil: XMLHttpRequest not supported');
        }
        reject(INTERNAL_ERROR);
      }
    }
    xhttp.onreadystatechange = function()
    {

      if (xhttp.readyState === XMLHttpRequest.DONE && (xhttp.status >= 200 && xhttp.status < 300))
      {
        debug.info('Success. Status:'+ xhttp.status);
        let data = {};
        data.httpStatus = xhttp.status;
        if (xhttp.status != 204) {// only if there is response
          data.data=JSON.parse(xhttp.responseText)
        } else {
          data.data=''
        }
        resolve(data);
      }
      else {
        let errCode;
        if (xhttp.readyState === XMLHttpRequest.DONE) {
          if (xhttp.status >= 500 && xhttp.status < 600)
          {
            errCode = server_errCode;

          }
          else if (xhttp.status === 400)
          {
            errCode =  bad_request_errCode;
          }
          else if ( xhttp.status === 401)
          {
            errCode = invalid_cred_errCode;

          }
          else if ( xhttp.status === 404)
          {
            errCode = api_not_found_errCode;

          }
          else
          {
            errCode = network_errCode;
          }
          let errObj = {};
          let errMsg;


          errObj.httpStatus = xhttp.status;
          if (xhttp.responseText) {
            errObj.errMsg = JSON.parse(xhttp.responseText);
          } else {
            errObj.errMsg = {'error':'error'};
          }

          debug.info('Failure. Status:'+ xhttp.status);
          errObj.errorCode = errCode;
          reject(errObj);
        }
      }
    };
    xhttp.open(method ? method.toUpperCase() : 'GET', url, true);
    for (let i = 0; i < headers.length; i++)
    {
      xhttp.setRequestHeader(headers[i].key, headers[i].value);
    }
    if (method=== "POST" ||method=== "PUT" ||method=== "PATCH") {
      xhttp.send(data);
    }

    else xhttp.send();

  });
}

// Convert a byte array to a hex string
function bytesToHex(bytes)
{
  for (var hex = [], i = 0; i < bytes.length; i++)
  {
    hex.push((bytes[i] >>> 4).toString(16));
    hex.push((bytes[i] & 0xF).toString(16));
  }
  return hex.join('');
}
// Convert a hex string to a byte array
function hexToBytes(hex)
{
  for (var bytes = [], c = 0; c < hex.length; c += 2)
  {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}
// JS literals are UTF-16 encoded
function ab2str(buf)
{
  return String.fromCharCode.apply(null, buf);
}
function str2ab(str)
{
  let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  let bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++)
  {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}
/*
* Query String is first split with '&' and then with '=' to form a
* key value pair and then replace extra symbols with a space and store
* and return as an array
*/
function pQString(qs)
{
  const s = /\+/g;
  let query = {};
  let a = qs.substr(0).split('&');
  for (let i = 0; i < a.length; i++)
  {
    let b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '').replace(s, ' ');
  }
  return query;
}


/*
* Logger function with option to enable/disable debugging
*/
const Debugger = gState => {
  let debug = {}
  if (!window.console) return function(){}
  if (gState) {
  for (let m in console)
    if (typeof console[m] == 'function')
    debug[m] = console[m].bind(window.console)
  }else{
  for (let m in console)
    if (typeof console[m] == 'function')
    debug[m] = function(){}
  }
  return debug
}

/********* Initialize the configuration after redirect and hash the access token ********/
function do_configuration(c)
{
  let profileId = Object.keys(c)[0];
  config = c;
  getTokenFromURLFragment(profileId);
}
/*********** Create and send authorization request *************/
function doAuthorize(profileId, configMap)
{
  let state, req, authURL,i;
  let encodedParams = '';
  state = configMap['state'];
  if(configMap['idTokenRequired'] && configMap['idTokenRequired'] === true) {
    req = { 'response_type' : 'token id_token' };
    req['nonce'] = getNonce();
  }
  else {
    req = { 'response_type' : 'token' };
  }
  req.state = state;
  req['redirect_uri'] = configMap['redirect_uri'];
  req['client_id'] = configMap['client_id'];
  req['scope'] = configMap['scope'].join(' ');

  let j = 0;
  for (i in req)
  {
    encodedParams += (j++ === 0 ? '?' : '&') + encodeURIComponent(i) + '='
        + encodeURIComponent(req[i]);
  }

  authURL = `${configMap['auth_url']}${encodedParams}`;
  debug.info(`Authorization url is`, authURL);
  if (window.location.hash)
  {
    req['restoreHash'] = window.location.hash;
  }
  req['profileId'] = profileId;
  // persist the state information in local storage, with state ID as key
  localStorage.setItem('s-' + state, JSON.stringify(req));
  window.location = authURL;
}

function performHttpOp(Op, apiURL, hdrs,params,profileId, payload)
{
  function performAPICall(decryptedToken)
  {
    const dt = decryptedToken.replace(/\0[\s\S]*$/g,'');
    let authHeader = 'Bearer ' + encodeURIComponent(new String(dt));
    hdrs.push({key:'Authorization',value:authHeader});
    let encodedParams='';
    if(params) {
      let j = 0;
      for (i in params)
      {
        encodedParams += (j++ === 0 ? '?' : '&') + encodeURIComponent(i) + '='
        + encodeURIComponent(params[i]);
      }
    }
    apiURL = apiURL + encodedParams;
    return xhrUtil(apiURL, Op, hdrs, profileId, payload);
  }

  // First do some basic checks. Like token present? What about scopes for the
  // Op under consideration?
  return new Promise ((resolve,reject) => {
    let token = getToken(profileId);
    if (!token)
    {
      debug.info("Token Error");
      reject(TOKEN_ERROR);
    }
    else// since token is present, go for API Call
    {
      // decrypt the encrypted token and carry on with the XHR call by invoking the callback
      decryptToken(token.access_token).then(
        (decToken) => {
          performAPICall(decToken).then(
            (data) => resolve(data),
            (err) => reject(err)
            );
        },
        (msg) => {
          debug.info(msg);
          let errObj = CRYPO_ERROR;
          errObj.errMsg = msg;
          reject(errObj);
        }
      );
    }
  });
}

function getStateFromProfileId(profileId) {

  let tokens = JSON.parse(localStorage.getItem('t-' + profileId));
  if (tokens) {

    let tokItems = tokens[0];
    return tokItems.state;
  } else return;

}

function getNonce()
{
  function s4()
  {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4()+ s4() + s4();
}

/********** Encrypts the token generated *************/
function encryptToken(token, cbparams)
{
  return new Promise((resolve, reject) => {
    encrypt(token).then((encData) => {
      cbparams.encToken = encData;
      saveEncToken(cbparams);
      resolve();},
      (msg) => {
        debug.info(msg);
        reject(msg);
    });
  });
}
/********** Decrypts the encrypted token *************/
function decryptToken(hexct)
{
  return new Promise((resolve, reject) => {
      decrypt(hexct).then((decData) => {
          resolve(decData);
        },
        (msg) => {
        debug.info(msg);
        reject(msg);
        }
      );
    });
}


/************* Retrieve the access token from url fragment after redirect and encrypt it and store it in local storage **************/
function getTokenFromURLFragment()
{
  return new Promise((resolve, reject) => {
    let token, state, stateID;
    let now = Math.round(new Date().getTime()/1000.0);
    //if returned with query params
    var query = location.search.substr(1);
    var result = {};
    if(query) {
      query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
      result.errMsg = result.error, result.httpStatus=200,  result.errorCode=server_errCode;
      reject(result);
    }
    let hashUrl = window.location.hash;
    if (hashUrl.length < 2)
    {
      resolve();
    }
    if (hashUrl.indexOf('access_token') === -1)
    {
      resolve();
    }
    hashUrl = hashUrl.substring(1);
    token = pQString(hashUrl);
    // set the token expiry absolute time using the expires_in value
    token['expiresAt'] = now + parseInt(token['expires_in'], 10);
    window.location.hash = '';
    stateID = token.state;
    if (stateID)
    {
      debug.info('Got state ID as:'+ stateID);
      state = JSON.parse(localStorage.getItem('s-'+stateID));
    }
    else
    {
      debug.info('Could not retrieve state from URL fragment');
      let errObj;
      errObj.errMsg = 'Could not retrieve state from URL fragment';
      reject(errObj);
    }
    if (state)
    {
      // clean up state from localStorage now that we have successfull retrieved state info
      debug.info('Retrieved state for profileId :' + state.profileId)
      localStorage.removeItem('s-'+stateID);
      const cbparams = {
        profileId : state['profileId'],
        token : token
      };
      encryptToken(token['access_token'],cbparams).then(() => {resolve(state.state);},
        (msg) => {
          debug.info(msg);
          let errObj = CRYPO_ERROR;
          errObj.errMsg = msg;
          reject(errObj);
        });
    }
    else
    {
      let errObj;
      errObj.errMsg = 'Could not retrieve state from localStorage';
      reject(errObj);
    }
  });
}
/*********** Callback function for Token Encryption which saves the token in the local storage after encryption ***************/
function saveEncToken(cbparams)
{
  let atoken = cbparams["token"];
  atoken['access_token'] = cbparams['encToken'];
  let tokens = JSON.parse(localStorage.getItem('t-' + cbparams['profileId']));
  if (!tokens)
  {
    tokens = [];
  }
  tokens = checkValidTokens(tokens);
  tokens.push(atoken);
  localStorage.setItem('t-' + cbparams['profileId'], JSON.stringify(tokens));
}
/************ Check whether token present before authorization ****************/
function retrieveToken(profileId, configMap)
{
  let token;
  token = getToken(profileId, configMap['scope']);
  if (!token)
  {
    doAuthorize(profileId, configMap);
    return false;
  }
  return true;
}
/************ Get the valid access token from local storage ***************/
// Check for token expiry as well as for scope validity.
function getToken(profile, scopes)
{
  let tokens = JSON.parse(localStorage.getItem('t-' + profile));
  if (tokens)
  {
    tokens = checkValidTokens(tokens, scopes);
    if (tokens.length > 0)
    {
      return tokens[0];
    }
    else
    {
      return;
    }
  }
  else
  {
    return;
  }
}
/************** Validate access tokens based on its expiry **************/
function checkValidTokens(tokens, scopes)
{
  let i, j,
  result = [],
  now = Math.round(new Date().getTime()/1000.0),
  usethis;
  if (!scopes)
  {
    scopes = [];
  }
  for(i = 0; i < tokens.length; i++)
  {
    usethis = true;
    let token;
    token = tokens[i];
    // Filter out expired tokens. Tokens that is expired in 1 second from now.
    if (token.expiresAt && token.expiresAt < (now+1))
    {
      usethis = false;
    }
    // Filter out this token if not all scope requirements are met
    for(j = 0; j < scopes.length; j++)
    {
      if (!hasScope(token, scopes[j]))
      {
        usethis = false;
      }
    }
    if (usethis)
    {
      result.push(token);
    }
  }
  return result;
}
/********** Check for the scope of token *************/
function hasScope(token, scope) {

  if (!token.scope)
  {
    return false;
  }
  let ss = token.scope.split(' ');
  let k;
  for(k = 0; k < ss.length; k++) {
    if (ss[k] === scope) return true;
  }
  return false;
}
/********** Get encryption key from indexDB *************/
function getKey()
{
  const txn = db.transaction([ TABLE_1 ], IDBTransaction.READ_WRITE);
  const objStore = txn.objectStore(TABLE_1);
  const request = objStore.get(STOREKEY);
  request.onerror = function(event)
  {
    debug.info('Unable to retrieve data from database!');
  };
  request.onsuccess = function(event)
  {
    // Do something with the request.result!
    if (aes128Key = request.result)
    {
      debug.info('Got key. Listing properties:');
      for ( let key in aes128Key)
      {
        debug.info(aes128Key[key]);
      }
      cryptoInitCallBack();
    }
    else
    {
      debug.info('Key could not be found in your database!');
      generateEncKey();
    }
  }
}
/********** Store the encryption key in indexDB *************/
function storeKey(aesKey)
{
  const txn = db.transaction([ TABLE_1 ], IDBTransaction.READ_WRITE);
  txn.oncomplete = function(evt)
  {
    debug.info('txn success');
  }
  txn.onabort = function(evt)
  {
    debug.info('txn failed');
    return;
  }
  const objStore1 = txn.objectStore(TABLE_1);
  // store key in table
  const request = objStore1.put(aesKey, STOREKEY);
  request.onerror = function()
  {
    debug.info('store failed');
  };
  request.onsuccess = function()
  {
    debug.info('key stored successfully');
  };
}
/********** Local DB check for upgrade needed or not *************/
function dbOnUpgradeNeeded(e)
{
  debug.info('running onupgradeneeded');
  debug.info('dbOnUpgradeNeeded');
  db = e.target.result;
  //Create Note
  if (!db.objectStoreNames.contains(TABLE_1))
  {
    debug.info('Create the TokenTable objectstore');
    var objectStore = db.createObjectStore(TABLE_1);
  }
}
/********** Check for accessibility of local db *************/
function dbError(evt)
{
  debug.info('Unable to open:' + DB_NAME);
}
/********** Loads the encKey else generates the encKey *************/
function dbSuccess(evt)
{
  debug.info('dbSuccess');
  db = evt.target.result;
  getKey();
}
/********** Clear the access token from local storage **************/
function do_clear(revokeConfigMap)
{
  function performRevokeAPICall (decryptedToken)
    {
      let hdrs=[];
      hdrs.push({key:'Content-Type',value:'application/x-www-form-urlencoded'});
      let apiURL = revokeConfigMap.revokeTokenUrl;
      let payload = {}
      payload['token'] = decryptedToken.replace(/\0[\s\S]*$/g,'')
      payload['token_type_hint'] = 'access_token';
      payload['client_id'] = revokeConfigMap.client_id;
      let payloadParams= '';
      let i,j=0;
      for (i in payload)
      {
        payloadParams += (j++ === 0 ? '' : '&') + i + '='
            + payload[i];
      }
        //var payload = 'token='+decryptedToken+'&token_type_hint=access_token&client_id='+revokeConfigMap.client_id;
      return xhrUtil(apiURL, 'POST', hdrs, revokeConfigMap.profileId, payloadParams);
    }

  return new Promise ((resolve,reject) => {
    let token = getToken(revokeConfigMap.profileId);
    localStorage.removeItem('t-' + revokeConfigMap.profileId);
    if(token)
    {
      decryptToken(token.access_token).then(
        (decToken) => {
          performRevokeAPICall(decToken).then(
            (data,status) => {
              resolve(data)
            },
            (err) =>
            reject(err)
            );
        },
        (msg) => {
          debug.info(msg);
          let errObj = CRYPO_ERROR;
          errObj.errMsg = msg;
          reject(errObj);
        }
      );
    }
  });
}
