/*
Copyright (c) 2016 CA. All rights reserved.
This software may be modified and distributed under the terms
of the MIT license. See the LICENSE file for details.
*/

//Processing of the msso-config.json
function getOAuthParams(configURL,profileId)
{
	if (!configURL.trim())
	{
    	configURL = 'msso_config.json';
	}
	var oauth_config;
	//////   XMLHttpRequest //////
	var xhttp;
	if (window.XMLHttpRequest)// code for modern browsers
	{
		xhttp = new XMLHttpRequest();
	}
	else // code for IE6, IE5
	{
		xhttp = new ActiveXObject('Microsoft.XMLHTTP');
	}
	xhttp.onreadystatechange = function()
	{
		if (xhttp.readyState == 4 && xhttp.status == 200)
		{
			oauth_config = JSON.parse(xhttp.responseText);
			server = oauth_config.server;
			server.prefix = oauth_config.server.prefix;
			configuration  = oauth_config.oauth.client.client_ids[0];
			if(!configuration)
			{
				console.error('Missing OAuth config parameters');
				return cajso.ERROR;
			}
			if(!oauth_config.oauth.system_endpoints.authorization_endpoint_path ||
				!oauth_config.server.hostname || !oauth_config.server.port)
			{
				console.error('Invalid OAuth authorization URI: ' + 'https://' + oauth_config.server.hostname + ':' +
					 oauth_config.server.port + oauth_config.oauth.system_endpoints.authorization_endpoint_path);
				return cajso.ERROR;
			}
			if(!server.prefix) {
				configuration.authorization = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port + oauth_config.oauth.system_endpoints.authorization_endpoint_path;
				configuration.oauth_demo_protected_api_endpoint_path = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port + oauth_config.custom.oauth_demo_protected_api_endpoint_path;
				configuration.tokenRevoke = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port + oauth_config.oauth.system_endpoints.token_revocation_endpoint_path;
			}
			else {
				configuration.authorization = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port +"/" + server.prefix + oauth_config.oauth.system_endpoints.authorization_endpoint_path;
				configuration.oauth_demo_protected_api_endpoint_path = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port +"/" + server.prefix + oauth_config.custom.oauth_demo_protected_api_endpoint_path;
				configuration.tokenRevoke = 'https://' + oauth_config.server.hostname + ':' +
					oauth_config.server.port +"/" + server.prefix + oauth_config.oauth.system_endpoints.token_revocation_endpoint_path;
			}
			configuration.state = stateID();
			configuration.scope = configuration.scope.split(' ');
			configuration.profileId = profileId;
			//debug.info('MSSO configuration ');
		}
	};
	xhttp.open('GET',configURL, true);
	xhttp.send();
}
function stateID()
{
	function s4()
	{
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4()+ s4() + s4();
}
