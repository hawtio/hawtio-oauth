/// <reference path="googleOAuthGlobals.ts"/>
module GoogleOAuth {

  var GOOGLE_TOKEN_STORAGE_KEY = 'googleAuthCreds';

  export function authenticatedHttpRequest(options, userDetails) {

    return $.ajax(_.extend(options, {
      beforeSend: (request) => {
        if (userDetails.token) {
          request.setRequestHeader('Authorization', 'Bearer ' + userDetails.token);
        }
      }
    }));
  }

  export function doLogout(config, userDetails) {
    // todo
  }

  export function doLogin(config, options) {
    var clientId = config.clientId;
    var redirectURI = config.redirectURI;
    var scope = config.scope;
    var targetURI = config.url;
    var uri = new URI(targetURI);

    uri.query({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectURI,
      scope: scope
    });
    var target = uri.toString();
    log.debug("Redirecting to URI: ", target);

    window.location.href = target;
  }

  export function exchangeCodeForToken(config, code, options) {

    var clientId = config.clientId;
    var clientSecret = config.clientSecret;
    var redirectURI = config.redirectURI;
    var uri = new URI('https://www.googleapis.com/oauth2/v3/token');

    uri.query({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      grant_type: 'authorization_code'
    });
    var target = uri.toString();
    log.debug("Redirecting to URI: ", target);

    window.location.href = target;
  }

  export function extractToken(uri) {
    var query = uri.query(true);
    var fragmentParams:any = new URI("?" + uri.fragment()).query(true);

    if (fragmentParams.access_token && fragmentParams.token_type === "Bearer") {
      log.debug("Got token");
      var localStorage = Core.getLocalStorage();
			var creds = {
				token_type: fragmentParams.token_type,
				access_token: fragmentParams.access_token,
				expires_in: fragmentParams.expires_in
			}
      localStorage['googleAuthCreds'] = angular.toJson(creds);
			delete fragmentParams.token_type;
			delete fragmentParams.access_token;
			delete fragmentParams.expires_in;
			uri.fragment("").query(fragmentParams);
			var target = uri.toString();
			log.debug("redirecting to: ", target);
      window.location.href = target;
			return creds;
    } else {
      log.info("No token in URI");
      return undefined;
    }
  }

  export function clearTokenStorage() {
    var localStorage = Core.getLocalStorage();
    delete localStorage[GOOGLE_TOKEN_STORAGE_KEY];
  }

  export function checkToken(uri) {
    var localStorage = Core.getLocalStorage();
    var answer = undefined;
    if (GOOGLE_TOKEN_STORAGE_KEY in localStorage) {
      try {
        answer = angular.fromJson(localStorage[GOOGLE_TOKEN_STORAGE_KEY]);
      } catch (e) {
        clearTokenStorage();
        // must be broken...
        log.error("Error extracting googleAuthCreds value: ", e);
      }
    }
    if (!answer) {
      answer = extractToken(uri);
    }
    log.debug("Using creds: ", answer);
    return answer;
  }

  export function checkAuthorizationCode(uri) {

    return uri.query(true).code;
  }


}
