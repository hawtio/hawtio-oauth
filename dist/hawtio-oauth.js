/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioKeycloak.pluginName = 'hawtio-keycloak';
    HawtioKeycloak.log = Logger.get(HawtioKeycloak.pluginName);
    HawtioKeycloak.keycloak = undefined;
})(HawtioKeycloak || (HawtioKeycloak = {}));

/// <reference path="keycloakGlobals.ts"/>

/// <reference path="keycloakGlobals.ts"/>
/// <reference path="keycloakHelpers.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioKeycloak._module = angular.module(HawtioKeycloak.pluginName, []);
    var userProfile = {};
    hawtioPluginLoader.addModule(HawtioKeycloak.pluginName);
    HawtioKeycloak._module.config(['$provide', function ($provide) {
        $provide.decorator('userDetails', ['$delegate', function ($delegate) {
            if (userProfile) {
                return _.merge($delegate, userProfile, {
                    logout: function () {
                        if (userProfile && HawtioKeycloak.keycloak) {
                            HawtioKeycloak.keycloak.logout();
                        }
                    }
                });
            }
            else {
                return $delegate;
            }
        }]);
    }]);
    HawtioKeycloak._module.config(['$httpProvider', function ($httpProvider) {
        if (userProfile) {
            $httpProvider.defaults.headers.common = {
                'Authorization': 'Bearer ' + userProfile.token
            };
        }
    }]);
    HawtioKeycloak._module.run(['userDetails', function (userDetails) {
        // log.debug("loaded, userDetails: ", userDetails);
    }]);
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        if (!window['KeycloakConfig']) {
            HawtioKeycloak.log.debug("Keycloak disabled");
            next();
            return;
        }
        var keycloak = HawtioKeycloak.keycloak = Keycloak(KeycloakConfig);
        keycloak.init().success(function (authenticated) {
            HawtioKeycloak.log.debug("Authenticated: ", authenticated);
            if (!authenticated) {
                keycloak.login({
                    redirectUri: window.location.href,
                });
            }
            else {
                keycloak.loadUserProfile().success(function (profile) {
                    userProfile = profile;
                    userProfile.token = keycloak.token;
                    next();
                }).error(function () {
                    HawtioKeycloak.log.debug("Failed to load user profile");
                    next();
                });
            }
        }).error(function () {
            HawtioKeycloak.log.debug("Failed to initialize keycloak, token unavailable");
            next();
        });
    });
})(HawtioKeycloak || (HawtioKeycloak = {}));

/// <reference path="../../includes.ts"/>
var OSOAuth;
(function (OSOAuth) {
    OSOAuth.pluginName = 'hawtio-os-oauth';
    OSOAuth.log = Logger.get(OSOAuth.pluginName);
})(OSOAuth || (OSOAuth = {}));

/// <reference path="osOAuthGlobals.ts"/>
var OSOAuth;
(function (OSOAuth) {
    var OS_TOKEN_STORAGE_KEY = 'osAuthCreds';
    function authenticatedHttpRequest(options, userDetails) {
        return $.ajax(_.extend(options, {
            beforeSend: function (request) {
                if (userDetails.token) {
                    request.setRequestHeader('Authorization', 'Bearer ' + userDetails.token);
                }
            }
        }));
    }
    OSOAuth.authenticatedHttpRequest = authenticatedHttpRequest;
    function doLogout(config, userDetails) {
        var currentURI = new URI(window.location.href);
        var uri = new URI(config.oauth_authorize_uri);
        uri.path('/osapi/v1beta1/oAuthAccessTokens' + userDetails.token);
        authenticatedHttpRequest({
            type: 'DELETE',
            url: uri.toString()
        }, userDetails).always(function () {
            clearTokenStorage();
            doLogin(OSOAuthConfig, {
                uri: currentURI.toString()
            });
        });
    }
    OSOAuth.doLogout = doLogout;
    function doLogin(config, options) {
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
        OSOAuth.log.debug("Redirecting to URI: ", target);
        window.location.href = target;
    }
    OSOAuth.doLogin = doLogin;
    function extractToken(uri) {
        var query = uri.query(true);
        OSOAuth.log.debug("Query: ", query);
        var fragmentParams = new URI("?" + uri.fragment()).query(true);
        OSOAuth.log.debug("FragmentParams: ", fragmentParams);
        if (fragmentParams.access_token && fragmentParams.token_type === "bearer") {
            OSOAuth.log.debug("Got token");
            var localStorage = Core.getLocalStorage();
            localStorage['osAuthCreds'] = angular.toJson(fragmentParams);
            return fragmentParams;
        }
        else {
            OSOAuth.log.debug("No token in URI");
            return undefined;
        }
    }
    OSOAuth.extractToken = extractToken;
    function clearTokenStorage() {
        var localStorage = Core.getLocalStorage();
        delete localStorage[OS_TOKEN_STORAGE_KEY];
    }
    OSOAuth.clearTokenStorage = clearTokenStorage;
    function checkToken(uri) {
        var localStorage = Core.getLocalStorage();
        var answer = undefined;
        if (OS_TOKEN_STORAGE_KEY in localStorage) {
            try {
                answer = angular.fromJson(localStorage[OS_TOKEN_STORAGE_KEY]);
            }
            catch (e) {
                clearTokenStorage();
                // must be broken...
                OSOAuth.log.debug("Error extracting osAuthCreds value: ", e);
            }
        }
        if (!answer) {
            answer = extractToken(uri);
        }
        OSOAuth.log.debug("Using creds: ", answer);
        return answer;
    }
    OSOAuth.checkToken = checkToken;
})(OSOAuth || (OSOAuth = {}));

/// <reference path="osOAuthHelpers.ts"/>
var OSOAuth;
(function (OSOAuth) {
    OSOAuth._module = angular.module(OSOAuth.pluginName, []);
    var userProfile = undefined;
    hawtioPluginLoader.addModule(OSOAuth.pluginName);
    OSOAuth._module.config(['$provide', function ($provide) {
        $provide.decorator('userDetails', ['$delegate', function ($delegate) {
            if (userProfile) {
                return _.merge($delegate, userProfile, {
                    username: userProfile.fullName,
                    logout: function () {
                        OSOAuth.doLogout(OSOAuthConfig, userProfile);
                    }
                });
            }
            else {
                return $delegate;
            }
        }]);
    }]);
    OSOAuth._module.config(['$httpProvider', function ($httpProvider) {
        if (userProfile) {
            $httpProvider.defaults.headers.common = {
                'Authorization': 'Bearer ' + userProfile.token
            };
        }
    }]);
    OSOAuth._module.run(['userDetails', function (userDetails) {
        // log.debug("loaded, userDetails: ", userDetails);
    }]);
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        if (!window['OSOAuthConfig']) {
            OSOAuth.log.debug("oauth disabled");
            next();
            return;
        }
        if (!OSOAuthConfig.oauth_client_id || !OSOAuthConfig.oauth_authorize_uri) {
            OSOAuth.log.debug("Invalid oauth config, disabled oauth");
            next();
            return;
        }
        OSOAuth.log.debug("config: ", OSOAuthConfig);
        var currentURI = new URI(window.location.href);
        var fragmentParams = OSOAuth.checkToken(currentURI);
        if (fragmentParams) {
            userProfile = {
                token: fragmentParams.access_token,
                expiry: fragmentParams.expires_in,
                type: fragmentParams.token_type
            };
            var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
            uri.path('/osapi/v1beta1/users/~');
            OSOAuth.authenticatedHttpRequest({
                type: 'GET',
                url: uri.toString(),
            }, userProfile).done(function (response) {
                _.extend(userProfile, response);
            }).fail(function () {
                OSOAuth.clearTokenStorage();
                OSOAuth.doLogin(OSOAuthConfig, {
                    uri: currentURI.toString()
                });
            }).always(function () {
                next();
            });
            OSOAuth.log.debug("Have token");
        }
        else {
            OSOAuth.clearTokenStorage();
            OSOAuth.doLogin(OSOAuthConfig, {
                uri: currentURI.toString()
            });
        }
    });
})(OSOAuth || (OSOAuth = {}));
