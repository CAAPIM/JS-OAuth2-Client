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

function cryptoInit()
{
  return new Promise((resolve, reject) => {
    if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle)
    {
      window.crypto.subtle = window.crypto.webkitSubtle;
      crypto.subtle = window.crypto.webkitSubtle;
    }
    dbInit().then((db) => getKey(db).then(() => {resolve('CryptoInit successfully');},
      (msg) => {reject(msg);}), (msg) => {reject(msg);});

  });
}

/********** Local DB check for upgrade needed or not *************/
function dbOnUpgradeNeeded(e)
{
  debug.info('running onupgradeneeded');
  debug.info('dbOnUpgradeNeeded');
  var db = e.target.result;
  //Create Note
  if (!db.objectStoreNames.contains(TABLE_1))
  {
    debug.info('Create the TokenTable objectstore');
    var objectStore = db.createObjectStore(TABLE_1);
  }
}

function dbInit()
{
  return new Promise((resolve, reject) => {
    debug.info('Db name is', DB_NAME);
    if (!window.indexedDB)
    {
      debug.info('indexeddb is not supported on this browser');
      reject('indexeddb is not supported on this browser');
    }
    if (!IDBTransaction.READ_WRITE)
    {
      IDBTransaction.READ_WRITE = 'readwrite';
    }
    var dbRequest = window.indexedDB.open(DB_NAME, 1);
    dbRequest.onerror = () => {
      debug.info('unable to open DB');
      reject('unable to open DB');
    }
    dbRequest.onsuccess = (evt) => {resolve(evt.target.result);};
    dbRequest.onupgradeneeded = dbOnUpgradeNeeded;
  });
}


/********** Generates the Encrypted Key *************/
function generateEncKey(db)
{
  return new Promise((resolve, reject) => {
    if (window.crypto.subtle)
    {
      keyop = window.crypto.subtle.generateKey(aesAlgorithmKeyGen, false, ['encrypt', 'decrypt' ]);
      keyop.then( (aesKey) =>
        {
          aes128Key = aesKey;
          storeKey(db, aes128Key);
          resolve('AES key generated successfully');
        },  () => {reject('Unable to generate key');});
    }
    else
    {
      reject('Web Cryptography API not supported - please update your browser');
    }
  });
}

function getKey(db)
{
  return new Promise((resolve, reject) => {
    var txn = db.transaction([ TABLE_1 ], IDBTransaction.READ_WRITE);
    var objStore = txn.objectStore(TABLE_1);
    var request = objStore.get(STOREKEY);
    request.onerror = function(event)
    {
      debug.info('Unable to retrieve data from database!');
      reject('Unable to retrieve data from database!');

    };
    request.onsuccess = function(event)
    {
      // Do something with the request.result!
      if (aes128Key = request.result)
      {
        debug.info('Got key. Listing properties:');
        for ( var key in aes128Key)
        {
          debug.info(aes128Key[key]);
        }
        resolve('Got key');
      }
      else
      {
        debug.info('Generating key...');
        generateEncKey(db).then((msg) => {resolve('Got key');}, (msg) => {reject(msg);});
      }
    }
  });
}
/********** Store the encryption key in indexDB *************/
function storeKey(db, aesKey)
{
  var txn = db.transaction([ TABLE_1 ], IDBTransaction.READ_WRITE);
  txn.oncomplete = function(evt)
  {
    debug.info('txn success');
  }
  txn.onabort = function(evt)
  {
    debug.info('txn failed');
    return;
  }
  var objStore1 = txn.objectStore(TABLE_1);
  // store key in table
  var request = objStore1.put(aesKey, STOREKEY);
  request.onerror = function()
  {
    debug.info('store failed');
  };
  request.onsuccess = function()
  {
    debug.info('key stored successfully');
  };
}


/********** Encrypts the data *************/
function encrypt(data)
{
  // takes plaintext string, returns encrypted, hex-encoded cyphertext
  return new Promise((resolve, reject) => {
    var salt = window.crypto.getRandomValues(new Uint8Array(16));
    var aesAlgorithmEncrypt = {
      name : 'AES-CBC',
      iv : salt
    };
    var encryptOp = window.crypto.subtle.encrypt(aesAlgorithmEncrypt, aes128Key,str2ab(data));

    encryptOp.then(
      (encData) => {
        cipherTextArrayBuffer = new Uint8Array(encData);
        // save the salt too
        localStorage.setItem('salt', bytesToHex(salt));
        resolve(bytesToHex(cipherTextArrayBuffer));
      }, () => {
        console.error.bind(console, 'Encryption failed using Crypto API.');
        reject('Encryption failed');
      }
    );
  });
}
/********** Decrypts the encrypted data *************/
function decrypt(hexct)
{
  // expects hex-encoded cypher text
  return new Promise((resolve, reject) => {
    var decryptedData;
    var s = new Uint8Array(hexToBytes(localStorage.getItem('salt')));
    var aesAlgo = {
      name : 'AES-CBC',
      iv : s
    };
    var decryptOp = window.crypto.subtle.decrypt(aesAlgo, aes128Key, new Uint8Array(hexToBytes(hexct)));
    decryptOp.then(
      (decData) => {
        decryptedData = decData;
        var plainTextArrayBuffer = new Uint8Array(decData);
        var plainTextstr;
        debug.info('Got decrypted text');
        resolve(ab2str(plainTextArrayBuffer));
      }, () => {
        console.error.bind(console, 'Decryption failed using Crypto API.');
        reject('Decryption failed using Crypto API.');
      }
    );
  });
}
