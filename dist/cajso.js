;(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.Cajso = factory();
  }
}(this, function() {
'use strict';

/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/
var SUCCESS = 0;
var ERROR = -1;
var TOKEN_ERROR = {
    httpStatus: 0,
    errorCode: -1001,
    errMsg: 'Token Error'
};
var INTERNAL_ERROR = {
    httpStatus: 0,
    errorCode: -1002,
    errMsg: 'xhrUtil: XMLHttpRequest not supported'
};
var CRYPTO_ERROR = {
    httpStatus: 0,
    errorCode: -1003,
    errMsg: 'Crypto Error'
};
var network_errCode = -1004;
var server_errCode = -1005;
var invalid_cred_errCode = -1006;
var api_not_found_errCode = -1007;
var bad_request_errCode = -1008;

var NETWORK_ERROR = void 0;
var SERVER_ERROR = void 0;
var INVALID_CREDENTIALS = void 0;
var API_NOT_FOUND = void 0;
var BAD_REQUEST = void 0;
/**********  Utility Functions  **************/
// util for creating XHRRequests 
function xhrUtil(url, method, headers, profileId, data) {
    return new Promise(function (resolve, reject) {
        var xhttp = void 0;
        try {
            xhttp = new XMLHttpRequest();
        } catch (e) {
            try {
                xhttp = new ActiveXObject('Msxml2.XMLHTTP');
            } catch (e) {
                if (console) {
                    debug.info('xhrUtil: XMLHttpRequest not supported');
                }
                reject(INTERNAL_ERROR);
            }
        }
        xhttp.onreadystatechange = function () {

            if (xhttp.readyState === XMLHttpRequest.DONE && xhttp.status >= 200 && xhttp.status < 300) {
                debug.info('Success. Status:' + xhttp.status);
                var _data = {};
                _data.httpStatus = xhttp.status;
                if (xhttp.status != 204) {
                    // only if there is response
                    _data.data = JSON.parse(xhttp.responseText);
                } else {
                    _data.data = '';
                }
                resolve(_data);
            } else {
                var errCode = void 0;
                if (xhttp.readyState === XMLHttpRequest.DONE) {
                    if (xhttp.status >= 500 && xhttp.status < 600) {
                        errCode = server_errCode;
                    } else if (xhttp.status === 400) {
                        errCode = bad_request_errCode;
                    } else if (xhttp.status === 401) {
                        localStorage.removeItem('t-' + profileId);
                        errCode = invalid_cred_errCode;
                    } else if (xhttp.status === 404) {
                        errCode = api_not_found_errCode;
                    } else {
                        errCode = network_errCode;
                    }
                    var errObj = {};
                    var errMsg = void 0;

                    errObj.httpStatus = xhttp.status;
                    if (xhttp.responseText) {
                        errObj.errMsg = JSON.parse(xhttp.responseText);
                    } else {
                        errObj.errMsg = { 'error': 'error' };
                    }

                    debug.info('Failure. Status:' + xhttp.status);
                    errObj.errorCode = errCode;
                    reject(errObj);
                }
            }
        };
        xhttp.open(method ? method.toUpperCase() : 'GET', url, true);
        for (var _i = 0; _i < headers.length; _i++) {
            xhttp.setRequestHeader(headers[_i].key, headers[_i].value);
        }
        if (method === "POST" || method === "PUT" || method === "PATCH") {
            xhttp.send(data);
        } else xhttp.send();
    });
}

// Convert a byte array to a hex string	
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        hex.push((bytes[i] >>> 4).toString(16));
        hex.push((bytes[i] & 0xF).toString(16));
    }
    return hex.join('');
}
// Convert a hex string to a byte array
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
}
// JS literals are UTF-16 encoded
function ab2str(buf) {
    return String.fromCharCode.apply(null, buf);
}
function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var _i2 = 0, strLen = str.length; _i2 < strLen; _i2++) {
        bufView[_i2] = str.charCodeAt(_i2);
    }
    return bufView;
}
/* 
* Query String is first split with '&' and then with '=' to form a 
* key value pair and then replace extra symbols with a space and store
* and return as an array
*/
function pQString(qs) {
    var s = /\+/g;
    var query = {};
    var a = qs.substr(0).split('&');
    for (var _i3 = 0; _i3 < a.length; _i3++) {
        var b = a[_i3].split('=');
        query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '').replace(s, ' ');
    }
    return query;
}

/*
* Logger function with option to enable/disable debugging
*/
var Debugger = function Debugger(gState) {
    var debug = {};
    if (!window.console) return function () {};
    if (gState) {
        for (var m in console) {
            if (typeof console[m] == 'function') debug[m] = console[m].bind(window.console);
        }
    } else {
        for (var _m in console) {
            if (typeof console[_m] == 'function') debug[_m] = function () {};
        }
    }
    return debug;
};

/********* Initialize the configuration after redirect and hash the access token ********/
function do_configuration(c) {
    var profileId = Object.keys(c)[0];
    config = c;
    getTokenFromURLFragment(profileId);
}
/*********** Create and send authorization request *************/
function doAuthorize(profileId, configMap) {
    var state = void 0,
        req = void 0,
        authURL = void 0,
        i = void 0;
    var encodedParams = '';
    state = configMap['state'];
    if (configMap['idTokenRequired'] && configMap['idTokenRequired'] === true) {
        req = { 'response_type': 'token id_token' };
        req['nonce'] = getNonce();
    } else {
        req = { 'response_type': 'token' };
    }
    req.state = state;
    req['redirect_uri'] = configMap['redirect_uri'];
    req['client_id'] = configMap['client_id'];
    req['scope'] = configMap['scope'].join(' ');

    var j = 0;
    for (i in req) {
        encodedParams += (j++ === 0 ? '?' : '&') + encodeURIComponent(i) + '=' + encodeURIComponent(req[i]);
    }

    authURL = '' + configMap['auth_url'] + encodedParams;
    debug.info('Authorization url is', authURL);
    if (window.location.hash) {
        req['restoreHash'] = window.location.hash;
    }
    req['profileId'] = profileId;
    // persist the state information in local storage, with state ID as key
    localStorage.setItem('s-' + state, JSON.stringify(req));
    window.location = authURL;
}

function performHttpOp(Op, apiURL, hdrs, params, profileId, payload) {
    function performAPICall(decryptedToken) {
        var dt = decryptedToken.replace(/\0[\s\S]*$/g, '');
        var authHeader = 'Bearer ' + encodeURIComponent(new String(dt));
        hdrs.push({ key: 'Authorization', value: authHeader });
        var encodedParams = '';
        if (params) {
            var j = 0;
            for (i in params) {
                encodedParams += (j++ === 0 ? '?' : '&') + encodeURIComponent(i) + '=' + encodeURIComponent(params[i]);
            }
        }
        apiURL = apiURL + encodedParams;
        return xhrUtil(apiURL, Op, hdrs, profileId, payload);
    }

    // First do some basic checks. Like token present? What about scopes for the 
    // Op under consideration?
    return new Promise(function (resolve, reject) {
        var token = getToken(profileId);
        if (!token) {
            debug.info("Token Error");
            reject(TOKEN_ERROR);
        } else // since token is present, go for API Call
            {
                // decrypt the encrypted token and carry on with the XHR call by invoking the callback
                decryptToken(token.access_token).then(function (decToken) {
                    performAPICall(decToken).then(function (data) {
                        return resolve(data);
                    }, function (err) {
                        return reject(err);
                    });
                }, function (msg) {
                    debug.info(msg);
                    reject(CRYPTO_ERROR);
                });
            }
    });
}

function getStateFromProfileId(profileId) {

    var tokens = JSON.parse(localStorage.getItem('t-' + profileId));
    if (tokens) {

        var tokItems = tokens[0];
        return tokItems.state;
    } else return;
}

function getNonce() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/********** Encrypts the token generated *************/
function encryptToken(token, cbparams) {
    return new Promise(function (resolve, reject) {
        encrypt(token).then(function (encData) {
            cbparams.encToken = encData;
            saveEncToken(cbparams);
            resolve();
        }, function (msg) {
            debug.info(msg);
            reject(msg);
        });
    });
}
/********** Decrypts the encrypted token *************/
function decryptToken(hexct) {
    return new Promise(function (resolve, reject) {
        decrypt(hexct).then(function (decData) {
            resolve(decData);
        }, function (msg) {
            debug.info(msg);
            reject(msg);
        });
    });
}

/************* Retrieve the access token from url fragment after redirect and encrypt it and store it in local storage **************/
function getTokenFromURLFragment() {
    return new Promise(function (resolve, reject) {
        var token = void 0,
            state = void 0,
            stateID = void 0;
        var now = Math.round(new Date().getTime() / 1000.0);
        //if returned with query params
        var query = location.search.substr(1);
        var result = {};
        if (query) {
            query.split("&").forEach(function (part) {
                var item = part.split("=");
                result[item[0]] = decodeURIComponent(item[1]);
            });
            reject(result);
        }
        var hashUrl = window.location.hash;
        if (hashUrl.length < 2) {
            resolve();
        }
        if (hashUrl.indexOf('access_token') === -1) {
            resolve();
        }
        hashUrl = hashUrl.substring(1);
        token = pQString(hashUrl);
        // set the token expiry absolute time using the expires_in value
        token['expiresAt'] = now + parseInt(token['expires_in'], 10);
        window.location.hash = '';
        stateID = token.state;
        if (stateID) {
            debug.info('Got state ID as:' + stateID);
            state = JSON.parse(localStorage.getItem('s-' + stateID));
        } else {
            debug.info('Could not retrieve state from URL fragment');
            reject('Could not retrieve state from URL fragment');
        }
        if (state) {
            // clean up state from localStorage now that we have successfull retrieved state info
            debug.info('Retrieved state for profileId :' + state.profileId);
            localStorage.removeItem('s-' + stateID);
            var cbparams = {
                profileId: state['profileId'],
                token: token
            };
            encryptToken(token['access_token'], cbparams).then(function () {
                resolve(state.state);
            }, function (msg) {
                reject(msg);
            });
        } else {
            reject('Could not retrieve state from localStorage');
        }
    });
}
/*********** Callback function for Token Encryption which saves the token in the local storage after encryption ***************/
function saveEncToken(cbparams) {
    var atoken = cbparams["token"];
    atoken['access_token'] = cbparams['encToken'];
    var tokens = JSON.parse(localStorage.getItem('t-' + cbparams['profileId']));
    if (!tokens) {
        tokens = [];
    }
    tokens = checkValidTokens(tokens);
    tokens.push(atoken);
    localStorage.setItem('t-' + cbparams['profileId'], JSON.stringify(tokens));
}
/************ Check whether token present before authorization ****************/
function retrieveToken(profileId, configMap) {
    var token = void 0;
    token = getToken(profileId, configMap['scope']);
    if (!token) {
        doAuthorize(profileId, configMap);
        return false;
    }
    return true;
}
/************ Get the valid access token from local storage ***************/
// Check for token expiry as well as for scope validity.
function getToken(profile, scopes) {
    var tokens = JSON.parse(localStorage.getItem('t-' + profile));
    if (tokens) {
        tokens = checkValidTokens(tokens, scopes);
        if (tokens.length > 0) {
            return tokens[0];
        } else {
            return;
        }
    } else {
        return;
    }
}
/************** Validate access tokens based on its expiry **************/
function checkValidTokens(tokens, scopes) {
    var i = void 0,
        j = void 0,
        result = [],
        now = Math.round(new Date().getTime() / 1000.0),
        usethis = void 0;
    if (!scopes) {
        scopes = [];
    }
    for (i = 0; i < tokens.length; i++) {
        usethis = true;
        var token = void 0;
        token = tokens[i];
        // Filter out expired tokens. Tokens that is expired in 1 second from now.
        if (token.expiresAt && token.expiresAt < now + 1) {
            usethis = false;
        }
        // Filter out this token if not all scope requirements are met
        for (j = 0; j < scopes.length; j++) {
            if (!hasScope(token, scopes[j])) {
                usethis = false;
            }
        }
        if (usethis) {
            result.push(token);
        }
    }
    return result;
}
/********** Check for the scope of token *************/
function hasScope(token, scope) {

    if (!token.scope) {
        return false;
    }
    var ss = token.scope.split(' ');
    var k = void 0;
    for (k = 0; k < ss.length; k++) {
        if (ss[k] === scope) return true;
    }
    return false;
}
/********** Get encryption key from indexDB *************/
function getKey() {
    var txn = db.transaction([TABLE_1], IDBTransaction.READ_WRITE);
    var objStore = txn.objectStore(TABLE_1);
    var request = objStore.get(STOREKEY);
    request.onerror = function (event) {
        debug.info('Unable to retrieve data from database!');
    };
    request.onsuccess = function (event) {
        // Do something with the request.result!
        if (aes128Key = request.result) {
            debug.info('Got key. Listing properties:');
            for (var key in aes128Key) {
                debug.info(aes128Key[key]);
            }
            cryptoInitCallBack();
        } else {
            debug.info('Key could not be found in your database!');
            generateEncKey();
        }
    };
}
/********** Store the encryption key in indexDB *************/
function storeKey(aesKey) {
    var txn = db.transaction([TABLE_1], IDBTransaction.READ_WRITE);
    txn.oncomplete = function (evt) {
        debug.info('txn success');
    };
    txn.onabort = function (evt) {
        debug.info('txn failed');
        return;
    };
    var objStore1 = txn.objectStore(TABLE_1);
    // store key in table
    var request = objStore1.put(aesKey, STOREKEY);
    request.onerror = function () {
        debug.info('store failed');
    };
    request.onsuccess = function () {
        debug.info('key stored successfully');
    };
}
/********** Local DB check for upgrade needed or not *************/
function dbOnUpgradeNeeded(e) {
    debug.info('running onupgradeneeded');
    debug.info('dbOnUpgradeNeeded');
    db = e.target.result;
    //Create Note
    if (!db.objectStoreNames.contains(TABLE_1)) {
        debug.info('Create the TokenTable objectstore');
        var objectStore = db.createObjectStore(TABLE_1);
    }
}
/********** Check for accessibility of local db *************/
function dbError(evt) {
    debug.info('Unable to open:' + DB_NAME);
}
/********** Loads the encKey else generates the encKey *************/
function dbSuccess(evt) {
    debug.info('dbSuccess');
    db = evt.target.result;
    getKey();
}
/********** Clear the access token from local storage **************/
function do_clear(revokeConfigMap) {
    function performRevokeAPICall(decryptedToken) {
        var hdrs = [];
        hdrs.push({ key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
        var apiURL = revokeConfigMap.revokeTokenUrl;
        var payload = {};
        payload['token'] = decryptedToken.replace(/\0[\s\S]*$/g, '');
        payload['token_type_hint'] = 'access_token';
        payload['client_id'] = revokeConfigMap.client_id;
        var payloadParams = '';
        var i = void 0,
            j = 0;
        for (i in payload) {
            payloadParams += (j++ === 0 ? '' : '&') + i + '=' + payload[i];
        }
        //var payload = 'token='+decryptedToken+'&token_type_hint=access_token&client_id='+revokeConfigMap.client_id;
        return xhrUtil(apiURL, 'POST', hdrs, revokeConfigMap.profileId, payloadParams);
    }

    return new Promise(function (resolve, reject) {
        var token = getToken(revokeConfigMap.profileId);
        localStorage.removeItem('t-' + revokeConfigMap.profileId);
        if (token) {
            decryptToken(token.access_token).then(function (decToken) {
                performRevokeAPICall(decToken).then(function (data, status) {
                    resolve(data);
                }, function (err) {
                    return reject(err);
                });
            }, function (msg) {
                debug.info(msg);
                reject(CRYPTO_ERROR);
            });
        }
    });
}
'use strict';

/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/

/*****************************************************************************************************************
 The crypt code below makes use of the new Web Cryptography APIs exclusively.
 Refer: http://www.w3.org/TR/WebCryptoAPI/ for further details of Web Crypto APIs.
 Following cryptographic operations are supported:
 1. AES-CBC (128 bit) Key Generation
 2. Encryption using AES-CBC
 3. Decryption using AES-CBC
 The encryption key is stored securely and persistently in IndexedDB after key generation. It is retrieved and
 used for decryption of encrypted data in further browser sessions. Details:
 Name of IndexedDB Database: ProfileId_JSOC
 Name of Table             : TokenTable
 Key                       : enckey
 Supported ON:
 IE11 & above
 Chrome 37 and above
 FireFox 35 and above
 ********************************************************************************************************************/
/************* Initialize Crypto & IndexedDB ****************/
/********** Internal IndexedDB Utility functions for encryption key storage ************/
/********** Get encryption key from indexDB *************/

//----------- Global Variables for Crypto & IndexedDB -----------//

function cryptoInit() {
	return new Promise(function (resolve, reject) {
		if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
			window.crypto.subtle = window.crypto.webkitSubtle;
			crypto.subtle = window.crypto.webkitSubtle;
		}
		dbInit().then(function (db) {
			return getKey(db).then(function () {
				resolve('CryptoInit successfully');
			}, function (msg) {
				reject(msg);
			});
		}, function (msg) {
			reject(msg);
		});
	});
}

/********** Local DB check for upgrade needed or not *************/
function dbOnUpgradeNeeded(e) {
	debug.info('running onupgradeneeded');
	debug.info('dbOnUpgradeNeeded');
	var db = e.target.result;
	//Create Note
	if (!db.objectStoreNames.contains(TABLE_1)) {
		debug.info('Create the TokenTable objectstore');
		var objectStore = db.createObjectStore(TABLE_1);
	}
}

function dbInit() {
	return new Promise(function (resolve, reject) {
		debug.info('Db name is', DB_NAME);
		if (!window.indexedDB) {
			debug.info('indexeddb is not supported on this browser');
			reject('indexeddb is not supported on this browser');
		}
		if (!IDBTransaction.READ_WRITE) {
			IDBTransaction.READ_WRITE = 'readwrite';
		}
		var dbRequest = window.indexedDB.open(DB_NAME, 1);
		dbRequest.onerror = function () {
			debug.info('unable to open DB');
			reject('unable to open DB');
		};
		dbRequest.onsuccess = function (evt) {
			resolve(evt.target.result);
		};
		dbRequest.onupgradeneeded = dbOnUpgradeNeeded;
	});
}

/********** Generates the Encrypted Key *************/
function generateEncKey(db) {
	return new Promise(function (resolve, reject) {
		if (window.crypto.subtle) {
			keyop = window.crypto.subtle.generateKey(aesAlgorithmKeyGen, false, ['encrypt', 'decrypt']);
			keyop.then(function (aesKey) {
				aes128Key = aesKey;
				storeKey(db, aes128Key);
				resolve('AES key generated successfully');
			}, function () {
				reject('Unable to generate key');
			});
		} else {
			reject('Web Cryptography API not supported - please update your browser');
		}
	});
}

function getKey(db) {
	return new Promise(function (resolve, reject) {
		var txn = db.transaction([TABLE_1], IDBTransaction.READ_WRITE);
		var objStore = txn.objectStore(TABLE_1);
		var request = objStore.get(STOREKEY);
		request.onerror = function (event) {
			debug.info('Unable to retrieve data from database!');
			reject('Unable to retrieve data from database!');
		};
		request.onsuccess = function (event) {
			// Do something with the request.result!
			if (aes128Key = request.result) {
				debug.info('Got key. Listing properties:');
				for (var key in aes128Key) {
					debug.info(aes128Key[key]);
				}
				resolve('Got key');
			} else {
				debug.info('Generating key...');
				generateEncKey(db).then(function (msg) {
					resolve('Got key');
				}, function (msg) {
					reject(msg);
				});
			}
		};
	});
}
/********** Store the encryption key in indexDB *************/
function storeKey(db, aesKey) {
	var txn = db.transaction([TABLE_1], IDBTransaction.READ_WRITE);
	txn.oncomplete = function (evt) {
		debug.info('txn success');
	};
	txn.onabort = function (evt) {
		debug.info('txn failed');
		return;
	};
	var objStore1 = txn.objectStore(TABLE_1);
	// store key in table
	var request = objStore1.put(aesKey, STOREKEY);
	request.onerror = function () {
		debug.info('store failed');
	};
	request.onsuccess = function () {
		debug.info('key stored successfully');
	};
}

/********** Encrypts the data *************/
function encrypt(data) {
	// takes plaintext string, returns encrypted, hex-encoded cyphertext
	return new Promise(function (resolve, reject) {
		var salt = window.crypto.getRandomValues(new Uint8Array(16));
		var aesAlgorithmEncrypt = {
			name: 'AES-CBC',
			iv: salt
		};
		var encryptOp = window.crypto.subtle.encrypt(aesAlgorithmEncrypt, aes128Key, str2ab(data));

		encryptOp.then(function (encData) {
			cipherTextArrayBuffer = new Uint8Array(encData);
			// save the salt too
			localStorage.setItem('salt', bytesToHex(salt));
			resolve(bytesToHex(cipherTextArrayBuffer));
		}, function () {
			console.error.bind(console, 'Encryption failed using Crypto API.');
			reject('Encryption failed');
		});
	});
}
/********** Decrypts the encrypted data *************/
function decrypt(hexct) {
	// expects hex-encoded cypher text
	return new Promise(function (resolve, reject) {
		var decryptedData;
		var s = new Uint8Array(hexToBytes(localStorage.getItem('salt')));
		var aesAlgo = {
			name: 'AES-CBC',
			iv: s
		};
		var decryptOp = window.crypto.subtle.decrypt(aesAlgo, aes128Key, new Uint8Array(hexToBytes(hexct)));
		decryptOp.then(function (decData) {
			decryptedData = decData;
			var plainTextArrayBuffer = new Uint8Array(decData);
			var plainTextstr;
			debug.info('Got decrypted text');
			resolve(ab2str(plainTextArrayBuffer));
		}, function () {
			console.error.bind(console, 'Decryption failed using Crypto API.');
			reject('Decryption failed using Crypto API.');
		});
	});
}
'use strict';

/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/

// Singleton used to hold the instance of Client that is created
var _jsoclient_instance_ = null;
//----------- Global Variables for Crypto & IndexedDB -----------//
var DB_NAME = 'CAJSOC';
var TABLE_1 = 'TokenTable';
var STOREKEY = 'enckey';
var db = void 0;
var indexedDB = null;
var aes128Key = null;
var keyop = void 0;
var cipherTextArrayBuffer = void 0;
var crypto = void 0;
var doInitCallBack = void 0;
var cryptoInitCallback = void 0;
var aesAlgorithmKeyGen = {
	name: 'aes-cbc',
	length: 128
};
var decryptedToken = void 0;

var isDebug = false; //global debug state
var configuration = {};
var server = {};

// we instantiate with the global switch 
var debug = void 0;

var cajso = function cajso() {
	//----------- Public Methods -----------//
	this.init = function () {
		debug = Debugger(isDebug);
		return new Promise(function (resolve, reject) {
			cryptoInit().then(function () {
				// page handling redirection will also call init, so retrieve token if available 
				// from URL Fragment. In either case, call initCallback...
				getTokenFromURLFragment().then(function (state) {
					resolve(state);
				}, function (msg) {
					reject(msg);
				});
			}, function (msg) {
				reject(msg);
			});
		});
	};
	// Fetch the token from local storage if available, or do the authorization
	// dance to get a token from auth server...
	this.authorize = function (profileId, configMap) {
		return retrieveToken(profileId, configMap);
	};

	this.get = function (apiURL, hdrs, params, profileId) {
		return performHttpOp('GET', apiURL, hdrs, params, profileId);
	};

	this.post = function (apiURL, hdrs, params, profileId, postData) {
		return performHttpOp('POST', apiURL, hdrs, params, profileId, postData);
	};

	this.put = function (apiURL, hdrs, params, profileId, putData) {
		return performHttpOp('PUT', apiURL, hdrs, params, profileId, putData);
	};

	this.patch = function (apiURL, hdrs, params, profileId, patchData) {
		return performHttpOp('PATCH', apiURL, hdrs, params, profileId, patchData);
	};

	this.delete = function (apiURL, hdrs, params, profileId) {
		return performHttpOp('DELETE', apiURL, hdrs, params, profileId);
	};

	this.isTokenAvailable = function (profileId) {
		var token = getToken(profileId);
		if (!token) return false;else return true;
	};
	this.revokeToken = function (revokeConfigMap) {
		return do_clear(revokeConfigMap);
	};

	this.getState = function (profileId) {
		return getStateFromProfileId(profileId);
	};

	_jsoclient_instance_ = this;
};
return cajso;
}));
