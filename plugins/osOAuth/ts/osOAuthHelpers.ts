/// <reference path="osOAuthGlobals.ts"/>
module OSOAuth {

  var OS_TOKEN_STORAGE_KEY = 'osAuthCreds';

  export function authenticatedHttpRequest(options, userDetails) {
    return $.ajax(_.extend(options, {
      beforeSend: (request) => {
        if (userDetails.token) {
          request.setRequestHeader('Authorization', 'Bearer ' + userDetails.token); 
        }
      }
    }));
  }

  export function doLogin(config, options) {
    var clientId = config.oauth_client_id;
    var targetURI = config.oauth_authorize_uri;
    var uri = new URI(targetURI);
    uri.query({
      client_id: clientId,
      response_type: 'token',
      state: options.uri,
      redirect_uri: options.uri
    });
    var target = uri.toString();
    log.debug("Redirecting to URI: ", target);
    window.location.href = target;
  }

  export function extractToken(uri) {
    var query = uri.query(true);
    log.debug("Query: ", query);
    var fragmentParams:any = new URI("?" + uri.fragment()).query(true); 
    log.debug("FragmentParams: ", fragmentParams);
    if (fragmentParams.access_token && fragmentParams.token_type === "bearer") {
      log.debug("Got token");
      var localStorage = Core.getLocalStorage();
      localStorage['osAuthCreds'] = angular.toJson(fragmentParams);
      return fragmentParams;
    } else {
      log.debug("No token in URI");
      return undefined;
    }
  }

  export function clearTokenStorage() {
    var localStorage = Core.getLocalStorage();
    delete localStorage[OS_TOKEN_STORAGE_KEY];
  }

  export function checkToken(uri) {
    var localStorage = Core.getLocalStorage();
    var answer = undefined;
    if (OS_TOKEN_STORAGE_KEY in localStorage) {
      try {
        answer = angular.fromJson(localStorage[OS_TOKEN_STORAGE_KEY]);
      } catch (e) {
        clearTokenStorage();
        // must be broken...
        log.debug("Error extracting osAuthCreds value: ", e);
      }
    }
    if (!answer) {
      answer = extractToken(uri);
    }
    log.debug("Using creds: ", answer);
    return answer;
  }


}
