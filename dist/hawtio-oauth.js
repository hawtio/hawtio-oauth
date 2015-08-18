/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>
var HawtioOAuth;
(function (HawtioOAuth) {
    var log = Logger.get('hawtio-oauth');
    HawtioOAuth.oauthPlugins = [];
    function getTasks() {
        return _.map(HawtioOAuth.oauthPlugins, function (entry) { return entry.task; });
    }
    HawtioOAuth.getTasks = getTasks;
    var userProfile = undefined;
    var activePlugin = undefined;
    function doLogout() {
        if (!activePlugin) {
            return;
        }
        var plugin = window[activePlugin];
        plugin.doLogout();
    }
    HawtioOAuth.doLogout = doLogout;
    function getUserProfile() {
        if (!userProfile) {
            activePlugin = _.find(HawtioOAuth.oauthPlugins, function (module) { return Core.pathGet(window, [module, 'userProfile']); });
            userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
            log.debug("Active OAuth plugin: ", activePlugin);
        }
        return userProfile;
    }
    HawtioOAuth.getUserProfile = getUserProfile;
    function getOAuthToken() {
        var userProfile = getUserProfile();
        if (!userProfile) {
            return null;
        }
        return userProfile.token;
    }
    HawtioOAuth.getOAuthToken = getOAuthToken;
    function authenticatedHttpRequest(options) {
        return $.ajax(_.extend(options, {
            beforeSend: function (request) {
                var token = getOAuthToken();
                if (token) {
                    request.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            }
        }));
    }
    HawtioOAuth.authenticatedHttpRequest = authenticatedHttpRequest;
})(HawtioOAuth || (HawtioOAuth = {}));
// global pre-bootstrap task that plugins can use to wait
// until all oauth plugins have been processed
// 
// OAuth plugins can add to this list via:
//
// HawtioOAuth.oauthPlugins.push(<plugin name>);
//
// and then use a named task with the same name as <plugin name>
//
console.log("Tasks: ", HawtioOAuth.getTasks());
hawtioPluginLoader.registerPreBootstrapTask({
    name: 'hawtio-oauth',
    depends: HawtioOAuth.oauthPlugins,
    task: function (next) {
        Logger.get('hawtio-oauth').info("All oauth plugins have executed");
        next();
    }
});

/// <reference path="../../includes.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    GoogleOAuth.pluginName = 'hawtio-google-oauth';
    GoogleOAuth.log = Logger.get(GoogleOAuth.pluginName);
    // Keep this unset unless we have a token
    GoogleOAuth.userProfile = null;
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
    function setupJQueryAjax(userDetails) {
        $.ajaxSetup({
            beforeSend: function (xhr) {
                var token = userDetails.token;
                if (token) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
                }
            }
        });
    }
    GoogleOAuth.setupJQueryAjax = setupJQueryAjax;
    function doLogout(config, userDetails) {
        if (config === void 0) { config = window['GoogleOAuthConfig']; }
        if (userDetails === void 0) { userDetails = GoogleOAuth.userProfile; }
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
        var targetURI = config.authenticationURI;
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
        var uri = new URI(config.tokenURI || 'https://www.googleapis.com/oauth2/v3/token');
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
                type: query.token_type.toLowerCase(),
                token: query.access_token,
                expiry: query.expires_in
            };
            localStorage[GOOGLE_TOKEN_STORAGE_KEY] = angular.toJson(creds);
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
        var value = localStorage[GOOGLE_TOKEN_STORAGE_KEY];
        if (value) {
            try {
                return angular.fromJson(value);
            }
            catch (e) {
                GoogleOAuth.log.warn("Failed to parse token json: " + value + ". " + e);
            }
        }
        return null;
    }
    GoogleOAuth.getTokenStorage = getTokenStorage;
    function setTokenStorage(userDetails) {
        var localStorage = Core.getLocalStorage();
        localStorage[GOOGLE_TOKEN_STORAGE_KEY] = angular.toJson(userDetails);
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
    function fetchUserInfo(http, successCallback, failureCallback) {
        http.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + HawtioOAuth.getUserProfile().access_token).
            success(successCallback).error(failureCallback);
    }
    GoogleOAuth.fetchUserInfo = fetchUserInfo;
})(GoogleOAuth || (GoogleOAuth = {}));

/// <reference path="googleOAuthHelpers.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    HawtioOAuth.oauthPlugins.push('GoogleOAuth');
    GoogleOAuth._module = angular.module(GoogleOAuth.pluginName, []);
    hawtioPluginLoader.addModule(GoogleOAuth.pluginName);
    GoogleOAuth._module.config(['$provide', function ($provide) {
            $provide.decorator('userDetails', ['$delegate', function ($delegate) {
                    if (GoogleOAuth.userProfile) {
                        return _.merge($delegate, GoogleOAuth.userProfile, {
                            username: GoogleOAuth.userProfile.fullName,
                            logout: function () {
                                GoogleOAuth.doLogout(GoogleOAuthConfig, GoogleOAuth.userProfile);
                            }
                        });
                    }
                    return $delegate;
                }]);
        }]);
    GoogleOAuth._module.config(['$httpProvider', function ($httpProvider) {
            if (GoogleOAuth.userProfile && GoogleOAuth.userProfile.token) {
                $httpProvider.defaults.headers.common = {
                    'Authorization': 'Bearer ' + GoogleOAuth.userProfile.token
                };
            }
        }]);
    GoogleOAuth._module.run(['userDetails', function (userDetails) {
        }]);
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'GoogleOAuth',
        task: function (next) {
            if (!window['GoogleOAuthConfig']) {
                GoogleOAuth.log.debug("oauth disabled");
                next();
                return;
            }
            if (!GoogleOAuthConfig.clientId ||
                !GoogleOAuthConfig.redirectURI ||
                !GoogleOAuthConfig.scope ||
                !GoogleOAuthConfig.authenticationURI) {
                GoogleOAuth.log.warn("Invalid oauth config, disabled oauth", GoogleOAuthConfig);
                next();
                return;
            }
            GoogleOAuth.log.debug("config: ", GoogleOAuthConfig);
            var currentURI = new URI(window.location.href);
            try {
                var userDetails = GoogleOAuth.getTokenStorage();
                if (userDetails && userDetails.token) {
                    GoogleOAuth.userProfile = userDetails;
                    GoogleOAuth.setupJQueryAjax(userDetails);
                    next();
                    return;
                }
                else {
                    // old format, let's force an update by re-authenticating
                    GoogleOAuth.clearTokenStorage();
                }
            }
            catch (err) {
                // must be a bad stored token
                GoogleOAuth.clearTokenStorage();
            }
            var authorizationCode = GoogleOAuth.checkAuthorizationCode(currentURI);
            if (authorizationCode) {
                GoogleOAuth.log.info("found an authorization code so need to go back to google and get a token");
                GoogleOAuth.exchangeCodeForToken(GoogleOAuthConfig, authorizationCode, {
                    uri: currentURI.toString(),
                }).done(function (response) {
                    if (response && response.access_token) {
                        var tmp = {
                            token: response.access_token,
                            expiry: response.expires_in,
                            type: response.token_type
                        };
                        GoogleOAuth.userProfile = _.merge(tmp, response, { provider: GoogleOAuth.pluginName });
                        GoogleOAuth.setTokenStorage(GoogleOAuth.userProfile);
                        GoogleOAuth.setupJQueryAjax(GoogleOAuth.userProfile);
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
                }).fail(function (jqHXR, textStatus, errorThrown) {
                    GoogleOAuth.log.error("Failed to fetch auth code, status: ", textStatus, " error: ", errorThrown);
                    GoogleOAuth.clearTokenStorage();
                    GoogleOAuth.doLogin(GoogleOAuthConfig, {
                        uri: currentURI.toString()
                    });
                });
            }
            else {
                GoogleOAuth.clearTokenStorage();
                GoogleOAuth.doLogin(GoogleOAuthConfig, {
                    uri: currentURI.toString()
                });
            }
        }
    });
})(GoogleOAuth || (GoogleOAuth = {}));

/// <reference path="../../includes.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioKeycloak.pluginName = 'hawtio-keycloak';
    HawtioKeycloak.log = Logger.get(HawtioKeycloak.pluginName);
    HawtioKeycloak.keycloak = undefined;
    // used by HawtioOAuth, must have a 'token' field when set, otherwise
    // leave undefined
    HawtioKeycloak.userProfile = undefined;
})(HawtioKeycloak || (HawtioKeycloak = {}));

/// <reference path="keycloakGlobals.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    function doLogout() {
        if (HawtioKeycloak.userProfile && HawtioKeycloak.keycloak) {
            HawtioKeycloak.keycloak.logout();
        }
    }
    HawtioKeycloak.doLogout = doLogout;
})(HawtioKeycloak || (HawtioKeycloak = {}));

/// <reference path="keycloakGlobals.ts"/>
/// <reference path="keycloakHelpers.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioOAuth.oauthPlugins.push('HawtioKeycloak');
    HawtioKeycloak._module = angular.module(HawtioKeycloak.pluginName, []);
    hawtioPluginLoader.addModule(HawtioKeycloak.pluginName);
    HawtioKeycloak._module.config(['$provide', '$httpProvider', function ($provide, $httpProvider) {
            $provide.decorator('userDetails', ['$delegate', function ($delegate) {
                    if (HawtioKeycloak.userProfile) {
                        return _.merge($delegate, HawtioKeycloak.userProfile, {
                            logout: function () {
                                if (HawtioKeycloak.userProfile && HawtioKeycloak.keycloak) {
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
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'HawtioKeycloak',
        task: function (next) {
            if (!window['KeycloakConfig']) {
                HawtioKeycloak.log.debug("Keycloak disabled");
                next();
                return;
            }
            var keycloak = HawtioKeycloak.keycloak = Keycloak(KeycloakConfig);
            keycloak.init()
                .success(function (authenticated) {
                HawtioKeycloak.log.debug("Authenticated: ", authenticated);
                if (!authenticated) {
                    keycloak.login({
                        redirectUri: window.location.href,
                    });
                }
                else {
                    keycloak.loadUserProfile()
                        .success(function (profile) {
                        HawtioKeycloak.userProfile = profile;
                        HawtioKeycloak.userProfile.token = keycloak.token;
                        next();
                    }).error(function () {
                        HawtioKeycloak.log.debug("Failed to load user profile");
                        next();
                    });
                }
            })
                .error(function () {
                HawtioKeycloak.log.debug("Failed to initialize Keycloak, token unavailable");
                next();
            });
        }
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
    // Keep this unset unless we have a token
    OSOAuth.userProfile = null;
})(OSOAuth || (OSOAuth = {}));

/// <reference path="osOAuthGlobals.ts"/>
var OSOAuth;
(function (OSOAuth) {
    var OS_TOKEN_STORAGE_KEY = 'osAuthCreds';
    function currentTimeSeconds() {
        return Math.floor(new Date().getTime() / 1000);
    }
    OSOAuth.currentTimeSeconds = currentTimeSeconds;
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
        if (config === void 0) { config = window['OSOAuthConfig']; }
        if (userDetails === void 0) { userDetails = OSOAuth.userProfile; }
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
                expires_in: fragmentParams.expires_in,
                obtainedAt: currentTimeSeconds()
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
    HawtioOAuth.oauthPlugins.push('OSOAuth');
    OSOAuth._module = angular.module(OSOAuth.pluginName, []);
    OSOAuth._module.config(['$provide', function ($provide) {
            $provide.decorator('userDetails', ['$delegate', function ($delegate) {
                    if (OSOAuth.userProfile) {
                        return _.merge($delegate, OSOAuth.userProfile, {
                            username: OSOAuth.userProfile.fullName,
                            logout: function () {
                                OSOAuth.doLogout(OSOAuthConfig, OSOAuth.userProfile);
                            }
                        });
                    }
                    return $delegate;
                }]);
        }]);
    OSOAuth._module.config(['$httpProvider', function ($httpProvider) {
            if (OSOAuth.userProfile && OSOAuth.userProfile.token) {
                $httpProvider.defaults.headers.common = {
                    'Authorization': 'Bearer ' + OSOAuth.userProfile.token
                };
            }
        }]);
    var keepaliveUri = undefined;
    var keepaliveInterval = undefined;
    OSOAuth._module.config(['KeepaliveProvider', function (KeepaliveProvider) {
            OSOAuth.log.debug("keepalive URI: ", keepaliveUri);
            OSOAuth.log.debug("keepalive interval: ", keepaliveInterval);
            if (keepaliveUri && keepaliveInterval) {
                KeepaliveProvider.http(keepaliveUri);
                KeepaliveProvider.interval(keepaliveInterval);
            }
        }]);
    OSOAuth._module.run(['userDetails', 'Keepalive', '$rootScope', function (userDetails, Keepalive, $rootScope) {
            if (OSOAuth.userProfile && OSOAuth.userProfile.token) {
                OSOAuth.log.debug("Starting keepalive");
                $rootScope.$on('KeepaliveResponse', function ($event, data, status) {
                    OSOAuth.log.debug("keepaliveStatus: ", status);
                    OSOAuth.log.debug("keepalive response: ", data);
                    if (status === 401) {
                        OSOAuth.doLogout(OSOAuthConfig, OSOAuth.userProfile);
                    }
                });
                Keepalive.start();
            }
        }]);
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'OSOAuth',
        task: function (next) {
            if (!window['OSOAuthConfig']) {
                OSOAuth.log.debug("oauth disabled");
                next();
                return;
            }
            if (!OSOAuthConfig.oauth_client_id ||
                !OSOAuthConfig.oauth_authorize_uri) {
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
                    type: fragmentParams.token_type,
                    obtainedAt: fragmentParams.obtainedAt || 0
                };
                var uri = new URI(OSOAuthConfig.oauth_authorize_uri);
                uri.path('/oapi/v1/users/~');
                keepaliveUri = uri.toString();
                OSOAuth.authenticatedHttpRequest({
                    type: 'GET',
                    url: keepaliveUri,
                }, tmp).done(function (response) {
                    OSOAuth.userProfile = _.merge(tmp, response, { provider: OSOAuth.pluginName });
                    var obtainedAt = Core.parseIntValue(OSOAuth.userProfile.obtainedAt) || 0;
                    var expiry = Core.parseIntValue(OSOAuth.userProfile.expiry) || 0;
                    if (obtainedAt) {
                        var remainingTime = (obtainedAt + expiry) - OSOAuth.currentTimeSeconds();
                        if (remainingTime > 0) {
                            keepaliveInterval = Math.round(remainingTime / 4);
                        }
                    }
                    if (!keepaliveInterval) {
                        keepaliveInterval = 600;
                    }
                    setTimeout(function () {
                        $.ajaxSetup({
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader('Authorization', 'Bearer ' + tmp.token);
                            }
                        });
                        next();
                    }, 10);
                }).fail(function (jqXHR, textStatus, errorThrown) {
                    OSOAuth.log.error("Failed to fetch user info, status: ", textStatus, " error: ", errorThrown);
                    OSOAuth.clearTokenStorage();
                    OSOAuth.doLogin(OSOAuthConfig, {
                        uri: currentURI.toString()
                    });
                });
            }
            else {
                OSOAuth.clearTokenStorage();
                OSOAuth.doLogin(OSOAuthConfig, {
                    uri: currentURI.toString()
                });
            }
        }
    });
    hawtioPluginLoader.addModule(OSOAuth.pluginName);
})(OSOAuth || (OSOAuth = {}));
