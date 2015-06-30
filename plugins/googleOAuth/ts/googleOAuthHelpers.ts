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
    console.debug("Logging out!");
    var token = getTokenStorage() || userDetails.token;

    var uri = new URI(window.location.href).removeQuery("code");
    var target = uri.toString();
    log.debug("Now logging in with URI: " + target);
    clearTokenStorage();
    doLogin(GoogleOAuthConfig, {
      uri: target
    });
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
      scope: scope,
      approval_prompt: 'force'
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

    return $.ajax({
      type: 'POST',
      url: target
    });
  }

  export function extractToken(query) {
    log.debug("query: ", query);

    if (query.access_token && query.token_type === "Bearer") {
      log.debug("Got token");
      var localStorage = Core.getLocalStorage();
			var creds = {
				token_type: query.token_type.toLowerCase(),
				access_token: query.access_token,
				expires_in: query.expires_in
			}
      localStorage['googleAuthCreds'] = angular.toJson(creds);
			delete query.token_type;
			delete query.access_token;
			delete query.expires_in;

      // SHOULD THIS BE CALLED?
			//var target = query.toString();
			//log.debug("redirecting to: ", target);
      //window.location.href = target;

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

  export function getTokenStorage() {
    var localStorage = Core.getLocalStorage();
    return localStorage[GOOGLE_TOKEN_STORAGE_KEY];
  }

  export function setTokenStorage(token) {
    var localStorage = Core.getLocalStorage();
    localStorage[GOOGLE_TOKEN_STORAGE_KEY] = token;
  }

  export function checkToken(query) {
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
      answer = extractToken(query);
    }
    log.debug("Using creds: ", answer);
    return answer;
  }

  export function checkAuthorizationCode(uri) {
    return uri.query(true).code;
  }
}
