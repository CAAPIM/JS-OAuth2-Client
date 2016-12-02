# CA JS OAuth 2.0 Getting Started Guide

## Table of Contents
1. [OAuth 2.0 (Open Authorization) Overview](#1)
2. [CA JS OAuth 2.0 Library Overview](#2)
3. [Set Up the CA JS OAuth Sample Application](#3)
    1. [Step1: Review the Prerequisites](#4)
    2. [Step2: Perform the Pre Installation Tasks](#5)
         1. [Install CA API Gateway and CA Mobile API Gateway](#6)
         2. [Register a Client with the CA OAuth Manager](#7)
         3. [Configure CA API Gateway](#8)
    3. [Step3: Download CA JS OAUTH 2.0 Library](#9)
    4. [Step4: Deploy the CA JS OAuth Sample Application](#10)
    5. [Step5: Use the CA JS OAuth Sample Application](#11)
	6. [Step6: Build the CA JS OAuth 2.0 library](#12)
4. [CA JS OAUTH 2.0 API Reference](#13)
    1. [Load and Initialize the CA JS OAuth 2.0 Library](#14)
    2. [Authorize](#15)
    3. [HTTP GET Request](#16)
    4. [HTTP POST Request](#17)
    5. [HTTP PUT Request](#18)
    6. [HTTP PATCH Request](#19)
    7. [HTTP DELETE Request](#20)
    8. [Remove Token](#21)
5. [API Error Codes](#22)

<a name="1"></a>
## OAuth 2.0 (Open Authorization) Overview 

OAuth is an authorization standard that allows one service to integrate with another service on behalf of a user. Instead of exposing user credentials, an OAuth access token is issued and accepted for user authentication. The OAuth authorization framework permits a user to grant an application (consumer) access to a protected resource without exposing the user's password credentials.

The CA JS OAuth 2.0 library supports the implicit grant type.

<a name="2"></a>
## CA JS OAuth 2.0 Library Overview 

CA JavaScript OAuth (CA JS OAuth) 2.0 library lets you implement the OAuth 2.0 implicit authorization flow in web applications. The CA JS OAuth 2.0 libraries exposes APIs that developers use to develop a web-based application. 

The CA JS OAuth 2.0 library is standards compliant, and can work with any third-party OAuth 2.0 providers such as LinkedIn, Google, and Facebook to implement the implicit flow in a browser. CA Mobile API Gateway is also one such OAuth 2.0 authorization server like Google, LinkedIn, and Facebook.

The CA JS OAuth 2.0 library lets you perform the following HTTP requests:

* GET

* POST

* PUT

* PATCH

* DELETE

<a name="3"></a>
## Set Up the CA JS OAuth Sample Application 
The CA JS OAuth 2.0 sample application uses the CA JS OAuth library, and interacts with _CA Mobile API Gateway_ (MAG) OAuth 2.0 endpoints to obtain the access token. Then, the sample application presents the token to access the protected resource **(/oauth/v2/protectedapi*)** on the MAG.

The following steps describe how to set up the sample application to work with MAG:
For more information about CA Mobile API Gateway, see the MAG [documentation](https://docops.ca.com/display/MAG32).

<a name="4"></a>
### Step1: Review the Prerequisites 
Before integrating the CA JS OAuth 2.0 library with your web application, ensure that your integration environment meets the following server requirements:

* CA API Gateway version 9.1

* CA Mobile API Gateway version 3.2
 
* CA API Management OAuth Toolkit (compatible with the MAG version)

<a name="5"></a>
### Step2: Perform the Pre Installation Tasks 

Before you install the CA JS OAuth sample application, install the following:

1. Install CA API Gateway, and CA Mobile API Gateway and compatible version of the CA API Management OAuth Toolkit.
2. Register a client with the CA OAuth Manager.
3. Configure CA API Gateway.

<a name="6"></a>
#### Install CA API Gateway and CA Mobile API Gateway 

Install the CA API Gateway and CA Mobile API Gateway and ensure that the systems are functional. For information about the CA API Gateway and MAG installation, see the [CA API Gateway](https://docops.ca.com/ca-api-gateway/9-1/en/) and [CA Mobile API Gateway](https://docops.ca.com/display/MAG32/Mobile+API+Gateway+Home) documentation.

<a name="7"></a>
#### Register a Client with the CA OAuth Manager 

Administrator registers the client on the CA OAuth Manager. For more information, how to register a client, see the Registering Clients with the OAuth Manager section in the [CA API Management OAuth Toolkit documentation](https://docops.ca.com/ca-api-management-oauth-toolkit/3-5/en/registering-clients-with-the-oauth-manager).

**Note:** 
	* Ensure that the value of the OAuth 2.0 **Client Type** is **public** to support the implicit flow. For more information, see the [Internet Engineering Task Force](https://tools.ietf.org/html/rfc6749) guidelines.
	
	* The Redirect URI should be: http://127.0.0.1:8080.

<a name="8"></a>
#### Configure CA API Gateway 

Administrator can configure CA API Gateway as follows:

1.  Create user accounts either in local database, or in the _Lightweight Directory Access Protocol_ (LDAP). Make a note of the user account details.

2.  Enable _Cross-Origin Resource Sharing_ (CORS) on the protected API *(/oauth/v2/protectedapi*)* using the Process CORS Request assertion. For more information, see the [Process CORS Request Assertion](https://docops.ca.com/ca-api-gateway/9-1/en/policy-assertions/assertion-palette/access-control-assertions/process-cors-request-assertion) in the CA API Gateway documentation.

<a name="9"></a>
### Step3: Download CA JS OAuth 2.0 Library

To download the CA JS OAuth 2.0 library to your machine, follow these steps:

Download the JavaScript-OAuth-Library.zip file from the [GitHub location](https://github.com/CAAPIM/JS-OAuth-Library) to a folder on your machine and extract the files.

1.  Navigate to the GitHub repository.

2.  Click the Download Zip button to download the files, and then extract it to your machine.
  

<a name="10"></a>
### Step4: Deploy the CA JS OAuth Sample Application 

Developers can install a CA JS OAuth sample application as follows:

1.  Copy the **msso_config.json** file to the **example** folder.

    **Note:** The **msso_config.json** file is created and exported as part of the client registration on CA OAuth Manager.

2.  Ensure that the **msso_config.json** file is in the same folder as the **index.html** file.

3.  Run the following command from the terminal:
	$ npm start

<a name="11"></a>
### Step5: Use the CA JS OAuth Sample Application 

1.  On Windows desktop machine (client machine), open the CA JS OAuth sample application by providing the following address in a browser:
      
    http://127.0.0.1:8080
    
    The following illustration shows the CA JS OAuth sample application:

    ![CA JS OAuth Client](./images/OAuth_Client.png?raw=true "Oauth Client")

2.  Click the Authorize button.

    Browser is redirected to the MAG Authorization End-Point as shown in the following illustration:

    ![CA JS OAuth Client login screen](./images/Login_Screen.png?raw=true "Login Screen")
    
    1. Enter the username and password for the user that you created in your local database or LDAP and click **Login**.
       
       You are presented with the following screen:
    
      ![CA JS OAuth Client Authorize screen](./images/Authorize_Screen.png?raw=true "Authorize Screen")

    2. Click **Grant**.

       Browser redirects you to the sample application page along with the access token that is generated for the user. The client stores it securely in the browser’s local storage.       
      
3.  Click the **Access API** button to access the protected API service available on MAG.

    1. Provide data in the **Enter data for the POST/PUT/PATCH request** field.

    By default, the *GET* method in the sample application retrieves data from the resource. To test the other HTTP methods, ensure that they are supported in the _/oauth/v2/protectedapi*_ policy implementation.

  MAG authorizes the user to access the protected APIs because of the available access token. The server responds with user information in JSON format, and displays it on the sample application page.

  <a name="12"></a>
### Step5: Build the CA JS OAuth 2.0 library
Follow the steps to build the CA JS OAuth 2.0 library:
1.	Ensure node.js is installed on your machine.
2.	Navigate to the parent directory.
3.	Open the terminal, and run the following command:
	$ npm install.

<a name="13"></a>
## CA JS OAuth 2.0 API Reference 
Follow the steps to use the CA JS OAuth 2.0 APIs:

1. Load and initialize the CA JS OAuth 2.0 library
 
2. Authorize 

3. Make the following HTTP requests:

  a. HTTP GET Request
 
  b. HTTP POST Request
 
  c. HTTP PUT Request
 
  d. HTTP DELETE Request

8. Remove Token

<a name="14"></a>
### Load and Initialize the CA JS OAuth 2.0 Library 

Load an instance of the jsoClient object to start the CA JS OAuth 2.0 library as follows:

```

require(["../dist/cajso.min"], function(CAJSOC) {
    jsoClient = new CAJSOC();
}
```
Initialize the jsoClient object as follows:

`jsoClient.init()`

Initializes Web Crypto (to provide cryptographic operation in web applications) and IndexDB (database on client).
 
 This API must be called before calling any other APIs. The API is called on the page load.

 A sample code is as follows:
 
```
<body onload='javascript:initialize();'>
function initialize()
{
    var p = jsoClient.init();
    p.then(
      (msg) => {
         console.log(msg);
      },
      (err) => {
         console.log(err);
      }
    );
}
```
<a name="15"></a>
### Authorize 

`jsoClient.authorize()`

Authorizes the CA JS OAuth 2.0 library to obtain the access token that is used to access the protected resource.
The syntax is as follows:

`jsoClient.authorize(profileId, configMap)`

Where:

**configMap**

Specifies a map of the OAuth2.0 parameters to start the authorization process.

**profileId**

Defines the profile name for which the OAuth authorization starts.
This API must be called after the successful Web Crypto and indexDB initialization.

A sample code is as follows:

```
function authorize()
{ 
  var configMap; 
  configMap = { client_id : configuration.client_id,
                redirect_uri : configuration.redirect_uri,
                auth_url :configuration.authorization,
                scope : configuration.scope,
                state : configuration.state }
                jsoClient.authorize(profileId, configMap);
 }
  ```

<a name="16"></a>
### HTTP GET Request 

`jsoClient.get()` 

Access the content of the protected API for a specific profile with headers, and success and failure callbacks using the HTTP GET method.

The syntax is as follows:

`jsoClient.get(apiURL, hdrs, params, profileId)`

Where:

**apiURL**

Specifies the URL to start the HTTP GET request.

**hdrs**

Specifies the custom headers for the HTTP GET request. The headers must be an array with the key value pairs.

**params**

Specifies the parameters that is sent as a request parameter.

**profileId**

Defines the profile name for which the OAuth authorization starts.
This API must be called after the successful authorization of the CA JS OAuth library.

A sample code is as follows:

```
var apiURL = configuration.oauth_demo_protected_api_endpoint_path;
var hdrs = {}; // any custom headers that the protected service API requires.
jsoClient.get(
apiURL,
hdrs,
params,
profileId).then(
   //---- SUCCESS Callback ----//
   function(data){
   //---- Handle data ----//
                  },
   //---- FAILURE Callback ----//
   function(err){
   //---- Handle error ----//
               }
    );
```

<a name="17"></a>
### HTTP POST Request 

`jsoClient.post()`

Accesses the protected API by requesting it with a payload for a specific profile with headers, success, and failure callbacks using the HTTP POST method.
This API must be called after the successful authorization of the client.

The syntax is as follows:

`jsoClient.post(apiURL, hdrs, params, profileId, postData)`

Where:

**apiURL**

Specifies the URL to start the HTTP POST request.

**hdrs**

Specifies the custom headers for the HTTP POST request. The headers must be an array with the key value pairs.

**params**

Specifies the parameters that is sent as a request parameter.

**profileId**

Defines the profile name for which the OAuth authorization starts.

**postData**

Specifies the data to post as a payload along with the HTTP POST request.

A sample code is as follows:

```
var apiURL = configuration.oauth_demo_protected_api_endpoint_path;
var hdrs = {}; // any custom headers required by protected service API
var postData = JSON.Stringify(data);
jsoClient.post(
apiURL,
hdrs,
params,
profileId,
postData).then (
    //---- SUCCESS Callback ----//
    function(data){
    //---- Handle data  ----//
                  },
    //---- FAILURE Callback----//
   function(err){
    //---- Handle error ----//
                 }
    );
```

<a name="18"></a>
### HTTP PUT Request 

`jsoClient.put()`

Accesses the protected API by requesting it with a payload for a specific profile with headers, success, and failure callbacks using the HTTP PUT method.

This API must be called after the successful authorization of the client.

The syntax is as follows:

`jsoClient.put(apiURL, hdrs, profileId, putData)`

Where:

**apiURL**

Specifies the URL to start the HTTP PUT request.

**hdrs**

Specifies the custom headers for the HTTP PUT request. The headers must be an array with the key value pairs.

**Params**

Specifies the parameters that is sent as a request parameter.

**profileId**

Defines the profile name for which the OAuth authorization starts.

**putData**

Specifies the data to post as a payload along with the HTTP PUT request.

A sample code is as follows:

```
var apiURL = configuration.oauth_demo_protected_api_endpoint_path;
var hdrs = {}; // any custom headers required by protected service API
var putData = JSON.Stringify(data);
jsoClient.put(
apiURL,
hdrs,
params,
profileId,
putData).then (
  //---- SUCCESS Callback ----//
  function(data){
  //---- Handle data ----//
                },
  //---- FAILURE Callback----//
  function(err){
  //---- Handle error ----//
               }
    );
```

 <a name="19"></a>
### HTTP PATCH Request 

`jsoClient.patch()`

Accesses the protected API by requesting it with a payload for a specific profile with headers, success and failure callbacks using the HTTP PATCH method.
This API must be called after the successful authorization of the client.

The syntax is as follows:

`jsoClient.patch(apiURL, hdrs, profileId, putData)`

Where:

**apiURL**

Specifies the URL to start the HTTP PATCH request.

**hdrs**

Specifies the custom headers for the HTTP PATCH request. The headers must be an array with key value pairs.

**Params**

Specifies the parameters that is sent as a request parameter.

**profileId**

Defines the profile name for which the OAuth authorization starts.

**patchData**

Specifies the data to post as a payload along with the HTTP PATCH request.

A sample code is as follows:

```
var apiURL = configuration.oauth_demo_protected_api_endpoint_path;
 var hdrs = {}; // any custom headers required by protected service API
 var patchData = JSON.Stringify(data);
var params = {};
var profileID = “mag”;
jsoClient.patch(
apiURL,
hdrs,
params,
profileId, 
patchData).then (
  //---- SUCCESS Callback ----//
   function (data){
  //---- Handle data ----//
 },
  //---- FAILURE Callback----//
 function(err){
  //---- Handle error ----//
              }
    );
 ```
 
<a name="20"></a>
### HTTP DELETE Request 

`jsoClient.delete()`

Deletes the content of the protected API for a specific profile with headers and success and failure callbacks using the HTTP DELETE method.

The syntax is as follows:

`jsoClient.delete(apiURL, hdrs, profileId)`

Where:

**apiURL**

Specifies the URL to start the HTTP DELETE request.

**hdrs**

Specifies the custom headers for the HTTP DELETE request. The headers must be an array with the key value pairs.

**Params**

Specifies the parameters that is sent as a request parameter.

**profileId**

Defines the profile name for which the OAuth authorization starts.
This API must be called after the successful authorization of the client.

A sample code is as follows:

```
var apiURL = configuration.oauth_demo_protected_api_endpoint_path;
var hdrs = {}; // any custom headers that the protected service API requires.
jsoClient.delete(
apiURL,
hdrs,
params,
profileId).then (
  //---- SUCCESS Callback ----//
  function(data){
  //---- Handle data ----//
                 },
  //---- FAILURE Callback----//
  function(err){
  //---- Handle error ----//
                }
    );
```

<a name="21"></a>
### Remove Token 

`jsoClient.revokeToken()`

Call this API to clear the access token from the browser’s local storage, and revoke it from the server that generates the access token.

The syntax is as follows:

`jsoClient.revokeToken(revokeConfigMap)`

Where:

**revokeConfigMap**

Specifies a map of the parameters to revoke the access token.

A sample code is as follows:

```
function removeToken ()
{
var revokeConfigMap;
revokeConfigMap = {
  client_id : configuration.client_id,
  profileId : configuration.profileId,
  revokeTokenUrl : configuration.tokenRevoke
                   }
jsoClient.revokeToken(revokeConfigMap) .then (
    function(data) {console.log(data.httpStatus)},
    function(err) {console.log(err.httpStatus)}
    );
}
```

<a name="22"></a>
## API Error Codes 

The following list defines the API error code and the reason why the error occurred:

Error code | Description
-----------|-------------
-1001 | Access token does not exist, or it has expired
-1002 | Internal error such as XMLHttpRequest is not supported
-1003 | Web Crypto is not supported
-1004 | Error occurred due to network failure
-1005 | Internal server error
-1006 | The HTTP request failed due to invalid username and password
-1007 | Requested API does not exist
-1008 | Bad request or invalid input