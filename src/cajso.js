/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/

// Singleton used to hold the instance of Client that is created
let _jsoclient_instance_ = null;
//----------- Global Variables for Crypto & IndexedDB -----------//
const DB_NAME = 'CAJSOC';
const TABLE_1 = 'TokenTable';
const STOREKEY = 'enckey';
let db;
let indexedDB = null;
let aes128Key = null;
let keyop;
let cipherTextArrayBuffer;
let crypto;
let doInitCallBack;
let cryptoInitCallback;
const aesAlgorithmKeyGen = {
  name : 'aes-cbc',
  length : 128
}
let decryptedToken;

let isDebug = false; //global debug state
let configuration = {};
let server = {};
let isJSSDKFlag = false;

// we instantiate with the global switch
let debug;

const cajso = function()
{
  //----------- Public Methods -----------//
  this.init = (configURL, profileId, isJSSDK) => {
    debug = Debugger(isDebug);
    isJSSDKFlag = isJSSDK;
    return new Promise((resolve, reject) => {
      getOAuthParams(configURL, profileId).then((config) => {
        configuration = config;
        cryptoInit().then(() => {
          // page handling redirection will also call init, so retrieve token if available
          // from URL Fragment. In either case, call initCallback...
          getTokenFromURLFragment().then((state) => {
            resolve(state);
          }, (errObj) => {
            reject(errObj);
          });
        }, (msg) => {
          let errObj = CRYPO_ERROR;
          errObj.errMsg = msg;
          reject(errObj);
        });
      }, (errObj) => {
          reject(errObj);
      });
    });
  }
  // Fetch the token from local storage if available, or do the authorization
  // dance to get a token from auth server...
  this.authorize = (profileId, configMap) =>
    retrieveToken(profileId, configMap);

  this.loginWithIDToken = (profileId, configMap, idToken) =>
    retrieveToken(profileId, configMap, idToken);

  this.get = (apiURL, hdrs,params, profileId, bearer) =>
    performHttpOp('GET', apiURL, hdrs,params, profileId, bearer);

  this.post = (apiURL,hdrs,params, profileId, bearer, postData) =>
    performHttpOp('POST', apiURL, hdrs,params, profileId, bearer, postData);

  this.put = (apiURL, hdrs,params, profileId, bearer, putData) =>
    performHttpOp('PUT', apiURL, hdrs,params, profileId, bearer, putData);

  this.patch = (apiURL, hdrs,params, profileId, bearer, patchData) =>
    performHttpOp('PATCH', apiURL, hdrs,params, profileId, bearer, patchData);

  this.delete = (apiURL, hdrs,params, profileId, bearer) =>
    performHttpOp('DELETE', apiURL, hdrs,params, profileId, bearer);

  this.isTokenAvailable = profileId =>
  {
    let token = getToken(profileId);
    if (!token) return false;
    else return true;
  }
  this.revokeToken = (revokeConfigMap) =>
    do_clear(revokeConfigMap);

  this.getState = profileId =>
    getStateFromProfileId(profileId);

  this.getConfig = () =>
    getConfig();

  _jsoclient_instance_ = this;
};
