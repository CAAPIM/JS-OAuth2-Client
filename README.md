# CA JS OAuth 2.0 Client
[![Build Status](https://travis-ci.org/CAAPIM/JS-OAuth2-Client.svg?branch=master)](https://travis-ci.org/CAAPIM/JS-OAuth2-Client)
[![dependencies](https://david-dm.org/CAAPIM/JS-OAuth2-Client.svg)](https://david-dm.org/CAAPIM/JS-OAuth2-Client)
[![devDependency Status](https://david-dm.org/CAAPIM/JS-OAuth2-Client/dev-status.svg)](https://david-dm.org/CAAPIM/JS-OAuth2-Client#info=devDependencies)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Overview
The CA JS OAuth 2.0 Client gives a JavaScript based library that implements OAuth 2.0 “Implicit” grant flow, as specified in the [https://tools.ietf.org/html/rfc6749](https://tools.ietf.org/html/rfc6749) site.

## Get Started
Follow the CA JS OAuth 2.0 Client Getting Started Guide, our step-by-step guide to get started. The Getting Started Guide is located in the docs folder of the [GitHub repository](docs).

## Feature Highlights
1. The CA JS OAuth 2.0 Client exposes APIs to perform the OAuth authorization protocol with a compliant Authorization server, and receive access token in response. 
2. The CA JS OAuth 2.0 Client interworks with CA Mobile API Gateway as well as other open third-party OAuth 2.0 providers. For example, Google, Facebook, and LinkedIn.
3. Access tokens are stored securely in HTML 5 local storage, after encryption.
4. For encryption, WebCrypto APIs are used.

## API Details
Get the API details from the CA JS OAuth 2.0 Client Getting Started Guide from the [GitHub repository](docs).

## Development

|`npm run <script>`|Description|
|------------------|-----------|
|`start`|Builds and starts the example app.|
|`build`|Build artifacts.|
|`build:example`|Build artifacts for the example app.|
|`commit`|Uses [commitizen](https://github.com/commitizen/cz-cli) to create properly formatted commit messages.|

## How Can You Contribute
Your contributions are welcome and much appreciated. To learn more, see the [Contribution Guidelines](CONTRIBUTING.md).

This project supports `commitizen`. You can use `npm run commit` to run the local instance of `commitizen` or `git cz` if you have it installed globally.

Alternatively, if you are simply using `git commit`, you must follow this format:
`git commit -m "<type>: <subject>"`

## License 
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms of the MIT license. To learn more, see the [License](LICENSE).
