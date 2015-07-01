/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    GoogleOAuth.pluginName = 'hawtio-google-oauth';
    GoogleOAuth.log = Logger.get(GoogleOAuth.pluginName);
})(GoogleOAuth || (GoogleOAuth = {}));

/// <reference path="googleOAuthGlobals.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    var GOOGLE_TOKEN_STORAGE_KEY = 'googleAuthCreds';
    function authenticatedHttpRequest(options, userDetails) {
        return $.ajax(_.extend(options, {
            beforeSend: function (request) {
                if (userDetails.token) {
                    request.setRequestHeader('Authorization', 'Bearer ' + userDetails.token);
                }
            }
        }));
    }
    GoogleOAuth.authenticatedHttpRequest = authenticatedHttpRequest;
    function doLogout(config, userDetails) {
        console.debug("Logging out!");
        var token = getTokenStorage() || userDetails.token;
        var uri = new URI(window.location.href).removeQuery("code");
        var target = uri.toString();
        GoogleOAuth.log.debug("Now logging in with URI: " + target);
        clearTokenStorage();
        doLogin(GoogleOAuthConfig, {
            uri: target
        });
    }
    GoogleOAuth.doLogout = doLogout;
    function doLogin(config, options) {
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
        GoogleOAuth.log.debug("Redirecting to URI: ", target);
        window.location.href = target;
    }
    GoogleOAuth.doLogin = doLogin;
    function exchangeCodeForToken(config, code, options) {
        var clientId = config.clientId;
        var clientSecret = config.clientSecret;
        var redirectURI = config.redirectURI;
        var uri = new URI(config.tokenUrl || 'https://www.googleapis.com/oauth2/v3/token');
        uri.query({
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectURI,
            grant_type: 'authorization_code'
        });
        var target = uri.toString();
        GoogleOAuth.log.debug("Redirecting to URI: ", target);
        return $.ajax({
            type: 'POST',
            url: target
        });
    }
    GoogleOAuth.exchangeCodeForToken = exchangeCodeForToken;
    function extractToken(query) {
        GoogleOAuth.log.debug("query: ", query);
        if (query.access_token && query.token_type === "Bearer") {
            GoogleOAuth.log.debug("Got token");
            var localStorage = Core.getLocalStorage();
            var creds = {
                token_type: query.token_type.toLowerCase(),
                access_token: query.access_token,
                expires_in: query.expires_in
            };
            localStorage['googleAuthCreds'] = angular.toJson(creds);
            delete query.token_type;
            delete query.access_token;
            delete query.expires_in;
            // SHOULD THIS BE CALLED?
            //var target = query.toString();
            //log.debug("redirecting to: ", target);
            //window.location.href = target;
            return creds;
        }
        else {
            GoogleOAuth.log.info("No token in URI");
            return undefined;
        }
    }
    GoogleOAuth.extractToken = extractToken;
    function clearTokenStorage() {
        var localStorage = Core.getLocalStorage();
        delete localStorage[GOOGLE_TOKEN_STORAGE_KEY];
    }
    GoogleOAuth.clearTokenStorage = clearTokenStorage;
    function getTokenStorage() {
        var localStorage = Core.getLocalStorage();
        return localStorage[GOOGLE_TOKEN_STORAGE_KEY];
    }
    GoogleOAuth.getTokenStorage = getTokenStorage;
    function setTokenStorage(token) {
        var localStorage = Core.getLocalStorage();
        localStorage[GOOGLE_TOKEN_STORAGE_KEY] = token;
    }
    GoogleOAuth.setTokenStorage = setTokenStorage;
    function checkToken(query) {
        var localStorage = Core.getLocalStorage();
        var answer = undefined;
        if (GOOGLE_TOKEN_STORAGE_KEY in localStorage) {
            try {
                answer = angular.fromJson(localStorage[GOOGLE_TOKEN_STORAGE_KEY]);
            }
            catch (e) {
                clearTokenStorage();
                // must be broken...
                GoogleOAuth.log.error("Error extracting googleAuthCreds value: ", e);
            }
        }
        if (!answer) {
            answer = extractToken(query);
        }
        GoogleOAuth.log.debug("Using creds: ", answer);
        return answer;
    }
    GoogleOAuth.checkToken = checkToken;
    function checkAuthorizationCode(uri) {
        return uri.query(true).code;
    }
    GoogleOAuth.checkAuthorizationCode = checkAuthorizationCode;
})(GoogleOAuth || (GoogleOAuth = {}));

/// <reference path="googleOAuthHelpers.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    GoogleOAuth._module = angular.module(GoogleOAuth.pluginName, []);
    var userProfile = {};
    hawtioPluginLoader.addModule(GoogleOAuth.pluginName);
    GoogleOAuth._module.config(['$provide', function ($provide) {
        $provide.decorator('userDetails', ['$delegate', function ($delegate) {
            if (userProfile) {
                return _.merge($delegate, userProfile, {
                    username: userProfile.fullName,
                    logout: function () {
                        GoogleOAuth.doLogout(GoogleOAuthConfig, userProfile);
                    }
                });
            }
            else {
                return $delegate;
            }
        }]);
    }]);
    GoogleOAuth._module.config(['$httpProvider', function ($httpProvider) {
        if (userProfile && userProfile.token) {
            $httpProvider.defaults.headers.common = {
                'Authorization': 'Bearer ' + userProfile.token
            };
        }
    }]);
    GoogleOAuth._module.run(['userDetails', function (userDetails) {
        // log.debug("loaded, userDetails: ", userDetails);
    }]);
    hawtioPluginLoader.registerPreBootstrapTask(function (next) {
        if (!window['GoogleOAuthConfig']) {
            GoogleOAuth.log.debug("oauth disabled");
            next();
            return;
        }
        if (!GoogleOAuthConfig.clientId || !GoogleOAuthConfig.redirectURI || !GoogleOAuthConfig.scope || !GoogleOAuthConfig.url) {
            GoogleOAuth.log.warn("Invalid oauth config, disabled oauth");
            next();
            return;
        }
        GoogleOAuth.log.debug("config: ", GoogleOAuthConfig);
        var currentURI = new URI(window.location.href);
        if ((userProfile && userProfile.token) || GoogleOAuth.getTokenStorage()) {
            next();
            return;
        }
        var authorizationCode = GoogleOAuth.checkAuthorizationCode(currentURI);
        if (authorizationCode) {
            GoogleOAuth.log.info("found an authorization code so need to go back to google and get a token");
            GoogleOAuth.exchangeCodeForToken(GoogleOAuthConfig, authorizationCode, {
                uri: currentURI.toString(),
            }).done(function (response) {
                GoogleOAuth.log.debug("Done", response);
                if (response && response.access_token) {
                    var tmp = {
                        token: response.access_token,
                        expiry: response.expires_in,
                        type: response.token_type
                    };
                    GoogleOAuth.log.debug("Got bearer token: " + tmp.token);
                    GoogleOAuth.setTokenStorage(tmp.token);
                    userProfile = {};
                    _.extend(userProfile, tmp, response);
                    $.ajaxSetup({
                        beforeSend: function (xhr) {
                            var token = userProfile.token;
                            if (token) {
                                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                            }
                        }
                    });
                    GoogleOAuth.log.info("Logged in with URL: " + window.location.href);
                    // lets remove the auth code
                    var uri = new URI(window.location.href).removeQuery("code");
                    var target = uri.toString();
                    GoogleOAuth.log.info("Now redirecting to: " + target);
                    window.location.href = target;
                }
                else {
                    GoogleOAuth.log.debug("No access token received!");
                    GoogleOAuth.clearTokenStorage();
                    GoogleOAuth.doLogin(GoogleOAuthConfig, {
                        uri: currentURI.toString()
                    });
                }
            }).fail(function (response) {
                GoogleOAuth.log.error("Failed");
            }).always(function () {
                GoogleOAuth.log.debug("Next");
                next();
            });
        }
        else {
            GoogleOAuth.clearTokenStorage();
            GoogleOAuth.doLogin(GoogleOAuthConfig, {
                uri: currentURI.toString()
            });
        }
    });
})(GoogleOAuth || (GoogleOAuth = {}));

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
    var userProfile = undefined;
    hawtioPluginLoader.addModule(HawtioKeycloak.pluginName);
    HawtioKeycloak._module.config(['$provide', '$httpProvider', function ($provide, $httpProvider) {
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
        // only add the itnerceptor if we have keycloak otherwise
        // we'll get an undefined exception in the interceptor
        if (HawtioKeycloak.keycloak) {
            $httpProvider.interceptors.push(AuthInterceptorService.Factory);
        }
    }]);
    HawtioKeycloak._module.run(['userDetails', 'Idle', '$rootScope', function (userDetails, Idle, $rootScope) {
        if (HawtioKeycloak.keycloak) {
            HawtioKeycloak.log.debug("Enabling idle timeout");
            Idle.watch();
            $rootScope.$on('IdleTimeout', function () {
                HawtioKeycloak.log.debug("Idle timeout triggered");
                // let the end application handle this event
                // userDetails.logout();
            });
            $rootScope.$on('Keepalive', function () {
                var keycloak = HawtioKeycloak.keycloak;
                if (keycloak) {
                    keycloak.updateToken(30);
                }
            });
        }
        else {
            HawtioKeycloak.log.debug("Not enabling idle timeout");
        }
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
            HawtioKeycloak.log.debug("Failed to initialize Keycloak, token unavailable");
            next();
        });
    });
    var AuthInterceptorService = (function () {
        function AuthInterceptorService($q) {
            var _this = this;
            this.$q = $q;
            this.request = function (request) {
                var addBearer, deferred;
                addBearer = function () {
                    var keycloak = HawtioKeycloak.keycloak;
                    return keycloak.updateToken(5).success(function () {
                        var token = HawtioKeycloak.keycloak.token;
                        request.headers.Authorization = 'Bearer ' + token;
                        deferred.notify();
                        return deferred.resolve(request);
                    }).error(function () {
                        console.log("Couldn't update token");
                    });
                };
                deferred = _this.$q.defer();
                addBearer();
                return _this.$q.when(deferred.promise);
            };
            this.responseError = function (rejection) {
                if (rejection.status === 401) {
                    HawtioKeycloak.keycloak.logout();
                }
                return _this.$q.reject(rejection);
            };
        }
        AuthInterceptorService.Factory = function ($q) {
            return new AuthInterceptorService($q);
        };
        AuthInterceptorService.$inject = ['$q'];
        return AuthInterceptorService;
    })();
    HawtioKeycloak._module.requires.push("ngIdle");
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
        uri.path('/oapi/v1/oAuthAccessTokens' + userDetails.token);
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
            var creds = {
                token_type: fragmentParams.token_type,
                access_token: fragmentParams.access_token,
                expires_in: fragmentParams.expires_in
            };
            localStorage['osAuthCreds'] = angular.toJson(creds);
            delete fragmentParams.token_type;
            delete fragmentParams.access_token;
            delete fragmentParams.expires_in;
            uri.fragment("").query(fragmentParams);
            var target = uri.toString();
            OSOAuth.log.debug("redirecting to: ", target);
            window.location.href = target;
            return creds;
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
        if (userProfile && userProfile.token) {
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
            var tmp = {
                token: fragmentParams.access_token,
                expiry: fragmentParams.expires_in,
                type: fragmentParams.token_type
            };
            var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
            uri.path('/oapi/v1/users/~');
            OSOAuth.authenticatedHttpRequest({
                type: 'GET',
                url: uri.toString(),
            }, tmp).done(function (response) {
                userProfile = {};
                _.extend(userProfile, tmp, response);
                $.ajaxSetup({
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + tmp.token);
                    }
                });
            }).fail(function () {
                OSOAuth.clearTokenStorage();
                OSOAuth.doLogin(OSOAuthConfig, {
                    uri: currentURI.toString()
                });
            }).always(function () {
                next();
            });
        }
        else {
            OSOAuth.clearTokenStorage();
            OSOAuth.doLogin(OSOAuthConfig, {
                uri: currentURI.toString()
            });
        }
    });
})(OSOAuth || (OSOAuth = {}));
