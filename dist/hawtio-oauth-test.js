var HawtioOAuth;
(function (HawtioOAuth) {
    HawtioOAuth.pluginName = 'hawtio-oauth';
    HawtioOAuth.log = Logger.get(HawtioOAuth.pluginName);
    HawtioOAuth.oauthPlugins = [];
})(HawtioOAuth || (HawtioOAuth = {}));
/// <reference path="oauth.globals.ts"/>
var HawtioOAuth;
(function (HawtioOAuth) {
    var userProfile = null;
    function getUserProfile() {
        if (!userProfile) {
            HawtioOAuth.log.debug("Finding 'userProfile' from the active OAuth plugin");
            findUserProfile();
        }
        return userProfile;
    }
    HawtioOAuth.getUserProfile = getUserProfile;
    function findUserProfile() {
        var activePlugin = _.find(HawtioOAuth.oauthPlugins, function (plugin) {
            var profile = Core.pathGet(window, [plugin, 'userProfile']);
            HawtioOAuth.log.debug("Module:", plugin, "userProfile:", profile);
            return !_.isNil(profile);
        });
        userProfile = Core.pathGet(window, [activePlugin, 'userProfile']);
        HawtioOAuth.log.debug("Active OAuth plugin:", activePlugin);
    }
    function getOAuthToken() {
        var userProfile = getUserProfile();
        if (!userProfile) {
            return null;
        }
        return userProfile.token;
    }
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
/// <reference path="../../oauth.globals.ts"/>
var GithubOAuth;
(function (GithubOAuth) {
    GithubOAuth.pluginName = 'hawtio-oauth-github';
    GithubOAuth.log = Logger.get(GithubOAuth.pluginName);
    GithubOAuth.templatePath = 'plugins/github/html';
    var LOCAL_STORAGE_KEY = 'GithubOAuthSettings';
    function emptyBeforeSend() {
        return true;
    }
    GithubOAuth.emptyBeforeSend = emptyBeforeSend;
    function getTokenCheckAuthURL(oauthSettings) {
        return UrlHelpers.join('https://api.github.com/applications', oauthSettings.clientId, 'tokens', oauthSettings.accessToken);
    }
    GithubOAuth.getTokenCheckAuthURL = getTokenCheckAuthURL;
    function getTokenCheckAuthHeader(oauthSettings) {
        return Core.getBasicAuthHeader(oauthSettings.clientId, oauthSettings.clientSecret);
    }
    GithubOAuth.getTokenCheckAuthHeader = getTokenCheckAuthHeader;
    function getAuthHeader(oauthSettings) {
        var token = oauthSettings.accessToken;
        if (!token) {
            return '';
        }
        return 'token ' + oauthSettings.accessToken;
    }
    GithubOAuth.getAuthHeader = getAuthHeader;
    function loadSettings() {
        var answer = {};
        if (LOCAL_STORAGE_KEY in localStorage) {
            var settings = localStorage[LOCAL_STORAGE_KEY];
            try {
                settings = angular.fromJson(settings);
                answer = settings;
            }
            catch (err) {
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        }
        return answer;
    }
    GithubOAuth.loadSettings = loadSettings;
    function storeSettings(settings, oauthSettings) {
        if (oauthSettings === void 0) { oauthSettings = undefined; }
        var toStore = {
            username: settings.username,
            avatarURL: settings.avatarURL,
            accessToken: settings.accessToken,
            name: settings.name
        };
        if (oauthSettings) {
            oauthSettings.username = toStore.username;
            oauthSettings.avatarURL = toStore.avatarURL;
            oauthSettings.accessToken = toStore.accessToken;
            oauthSettings.name = toStore.name;
        }
        ;
        localStorage[LOCAL_STORAGE_KEY] = angular.toJson(toStore);
    }
    GithubOAuth.storeSettings = storeSettings;
})(GithubOAuth || (GithubOAuth = {}));
/// <reference path="../../oauth.globals.ts"/>
/// <reference path="githubHelpers.ts"/>
var GithubOAuth;
(function (GithubOAuth) {
    GithubOAuth._module = angular.module(GithubOAuth.pluginName, []);
    var settings = {
        enabled: false,
        username: undefined,
        clientId: undefined,
        clientSecret: undefined,
        accessToken: undefined,
        avatarURL: undefined,
        name: undefined,
        scopes: ['user', 'repo', 'read:org'],
        authURL: 'https://github.com/login/oauth/authorize',
        tokenURL: 'https://api.github.com/authorizations',
        loginURL: 'https://api.github.com/user'
    };
    GithubOAuth._module.constant('githubOAuthSettings', settings);
    GithubOAuth._module.service('GithubOAuth', ['githubOAuthSettings', function (settings) {
            var self = {
                settings: settings,
                hasToken: function () {
                    return !Core.isBlank(self.settings.accessToken);
                },
                getToken: function () {
                    return self.settings.accessToken;
                },
                getHeader: function () {
                    return GithubOAuth.getAuthHeader(self.settings);
                },
                getPreferencesLink: function () { }
            };
            return self;
        }]);
    GithubOAuth._module.run(['preferencesRegistry', function (preferencesRegistry) {
            preferencesRegistry.addTab("Github", UrlHelpers.join(GithubOAuth.templatePath, "githubPreferences.html"), function () { return settings.enabled; });
            GithubOAuth.log.debug("loaded");
        }]);
    hawtioPluginLoader.addModule(GithubOAuth.pluginName);
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'GithubOAuthConfig',
        depends: ['HawtioOAuthConfig'],
        task: function (next) {
            if (window['HAWTIO_OAUTH_CONFIG']) {
                var clientId = settings.clientId = Core.pathGet(HAWTIO_OAUTH_CONFIG, ['github', 'clientId']);
                var clientSecret = settings.clientSecret = Core.pathGet(HAWTIO_OAUTH_CONFIG, ['github', 'clientSecret']);
                if (clientId && clientSecret) {
                    GithubOAuth.log.debug("enabled");
                    settings.enabled = true;
                }
            }
            next();
        }
    });
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'GithubOAuthSettings',
        depends: ['GithubOAuthConfig'],
        task: function (next) {
            if (settings.enabled) {
                _.assign(settings, GithubOAuth.loadSettings());
            }
            next();
        }
    });
    /*
    hawtioPluginLoader.registerPreBootstrapTask({
      name: 'GithubTokenReader',
      depends: ['GithubOAuthConfig'],
      task: (next) => {
        if (!settings.enabled) {
          next();
          return;
        }
        let uri = new URI();
        let search = uri.search(true);
        let accessCode = search['code'];
        if (accessCode) {
          log.debug("Found github access code");
          delete search['code'];
          $.ajax(settings.tokenURL, <any> {
            method: 'POST',
            data: {
              client_id: settings.clientId
            }
  
          });
          uri.search(search);
          window.location.href = uri.toString();
        } else {
          next();
        }
      }
    });
    */
})(GithubOAuth || (GithubOAuth = {}));
/// <reference path="../../oauth.globals.ts"/>
var GoogleOAuth;
(function (GoogleOAuth) {
    GoogleOAuth.pluginName = 'hawtio-oauth-google';
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
                    // setupJQueryAjax(userDetails);
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
/// <reference path="../../oauth.globals.ts"/>
var OSOAuth;
(function (OSOAuth) {
    OSOAuth.pluginName = 'hawtio-oauth-os';
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
            redirect_uri: options.uri,
            scope: config.scope
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
        if (fragmentParams.access_token && (fragmentParams.token_type === "bearer") || fragmentParams.token_type === "Bearer") {
            OSOAuth.log.debug("Got token");
            var localStorage_1 = Core.getLocalStorage();
            var creds = {
                token_type: fragmentParams.token_type,
                access_token: fragmentParams.access_token,
                expires_in: fragmentParams.expires_in,
                obtainedAt: currentTimeSeconds()
            };
            localStorage_1[OS_TOKEN_STORAGE_KEY] = angular.toJson(creds);
            delete fragmentParams.token_type;
            delete fragmentParams.access_token;
            delete fragmentParams.expires_in;
            delete fragmentParams.scope;
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
    OSOAuth._module = angular.module(OSOAuth.pluginName, ['ngIdle']);
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
            var openshiftConfig = null;
            try {
                openshiftConfig = window['OPENSHIFT_CONFIG'];
            }
            catch (e) {
                // ignore
            }
            if (openshiftConfig) {
                var token_1 = openshiftConfig.token;
                if (token_1) {
                    OSOAuth.log.warn("Loading OAuth token from server. We should switch to using a real OAuth login!");
                    OSOAuth.userProfile = {
                        token: token_1
                    };
                    $.ajaxSetup({
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + token_1);
                        }
                    });
                    next();
                    return;
                }
            }
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
                var tmp_1 = {
                    token: fragmentParams.access_token,
                    expiry: fragmentParams.expires_in,
                    type: fragmentParams.token_type,
                    obtainedAt: fragmentParams.obtainedAt || 0
                };
                var uri = void 0;
                if (openshiftConfig && openshiftConfig.master_uri) {
                    uri = new URI(openshiftConfig.master_uri);
                    uri.segment('oapi/v1/users/~');
                }
                else {
                    uri = new URI(OSOAuthConfig.oauth_authorize_uri);
                    uri.path('/oapi/v1/users/~');
                }
                keepaliveUri = uri.toString();
                OSOAuth.userProfile = tmp_1;
                $.ajax({
                    type: 'GET',
                    url: keepaliveUri,
                    success: function (response) {
                        _.merge(OSOAuth.userProfile, tmp_1, response, { provider: OSOAuth.pluginName });
                        var obtainedAt = Core.parseIntValue(OSOAuth.userProfile.obtainedAt) || 0;
                        var expiry = Core.parseIntValue(OSOAuth.userProfile.expiry) || 0;
                        if (obtainedAt) {
                            var remainingTime = obtainedAt + expiry - OSOAuth.currentTimeSeconds();
                            if (remainingTime > 0) {
                                keepaliveInterval = Math.round(remainingTime / 4);
                            }
                        }
                        if (!keepaliveInterval) {
                            keepaliveInterval = 10;
                        }
                        OSOAuth.log.debug("userProfile: ", OSOAuth.userProfile);
                        $.ajaxSetup({
                            beforeSend: function (xhr) { return xhr.setRequestHeader('Authorization', 'Bearer ' + OSOAuth.userProfile.token); }
                        });
                        next();
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        // The request may have been cancelled as the browser refresh request in
                        // extractToken may be triggered before getting the AJAX response.
                        // In that case, let's just skip the error and go through another refresh cycle.
                        // See http://stackoverflow.com/questions/2000609/jquery-ajax-status-code-0 for more details.
                        if (jqXHR.status > 0) {
                            OSOAuth.log.error('Failed to fetch user info, status: ', textStatus, ' error: ', errorThrown);
                            OSOAuth.clearTokenStorage();
                            OSOAuth.doLogin(OSOAuthConfig, { uri: currentURI.toString() });
                        }
                    },
                    beforeSend: function (request) { return request.setRequestHeader('Authorization', 'Bearer ' + OSOAuth.userProfile.token); }
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
/// <reference path="../oauth.globals.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioKeycloak.pluginName = 'hawtio-oauth-keycloak';
    HawtioKeycloak.log = Logger.get(HawtioKeycloak.pluginName);
    /**
     * Variable for Keycloak config that users can initialise.
     */
    HawtioKeycloak.config = null;
    HawtioKeycloak.keycloak = null;
    /**
     * Used by HawtioOAuth, must have a 'token' field when set,
     * otherwise leave null
     */
    HawtioKeycloak.userProfile = null;
})(HawtioKeycloak || (HawtioKeycloak = {}));
/// <reference path="keycloak.globals.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    var AuthInterceptor = /** @class */ (function () {
        AuthInterceptor.$inject = ["$q", "userDetails"];
        function AuthInterceptor($q, userDetails) {
            'ngInject';
            var _this = this;
            this.$q = $q;
            this.userDetails = userDetails;
            this.keycloak = HawtioKeycloak.keycloak;
            this.request = function (request) {
                // bypass for local templates
                if (request.url.indexOf('http') !== 0) {
                    return request;
                }
                var deferred = _this.$q.defer();
                _this.addBearer(request, deferred);
                return _this.$q.when(deferred.promise);
            };
            this.responseError = function (rejection) {
                if (rejection.status === 401) {
                    _this.keycloak.logout();
                }
                return _this.$q.reject(rejection);
            };
        }
        AuthInterceptor.Factory = ["$q", "userDetails", function ($q, userDetails) {
            'ngInject';
            return new AuthInterceptor($q, userDetails);
        }];
        AuthInterceptor.prototype.addBearer = function (request, deferred) {
            var _this = this;
            this.keycloak.updateToken(5)
                .success(function () {
                var token = _this.keycloak.token;
                _this.userDetails.token = token;
                request.headers.Authorization = 'Bearer ' + token;
                deferred.notify();
                deferred.resolve(request);
            })
                .error(function () {
                HawtioKeycloak.log.error("Couldn't update token");
            });
        };
        return AuthInterceptor;
    }());
    HawtioKeycloak.AuthInterceptor = AuthInterceptor;
})(HawtioKeycloak || (HawtioKeycloak = {}));
var HawtioKeycloak;
(function (HawtioKeycloak) {
    var KeycloakService = /** @class */ (function () {
        function KeycloakService(enabled, keycloak) {
            this.enabled = enabled;
            this.keycloak = keycloak;
        }
        return KeycloakService;
    }());
    HawtioKeycloak.KeycloakService = KeycloakService;
})(HawtioKeycloak || (HawtioKeycloak = {}));
/// <reference path="keycloak.globals.ts"/>
/// <reference path="keycloak.interceptor.ts"/>
/// <reference path="keycloak.service.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    applyAuthInterceptor.$inject = ["$provide", "$httpProvider"];
    loginUserDetails.$inject = ["userDetails", "postLogoutTasks"];
    configureIdleTimeout.$inject = ["userDetails", "Idle", "$rootScope"];
    HawtioOAuth.oauthPlugins.push('HawtioKeycloak');
    angular
        .module(HawtioKeycloak.pluginName, ['ngIdle'])
        .config(applyAuthInterceptor)
        .factory('keycloakService', function () { return new HawtioKeycloak.KeycloakService(isKeycloakEnabled(), HawtioKeycloak.keycloak); })
        .run(loginUserDetails)
        .run(configureIdleTimeout);
    function isKeycloakEnabled() {
        if (HawtioKeycloak.keycloak && HawtioKeycloak.userProfile) {
            return true;
        }
        else {
            return false;
        }
    }
    function applyAuthInterceptor($provide, $httpProvider) {
        'ngInject';
        // only add the interceptor if we have keycloak otherwise
        // we'll get an undefined exception in the interceptor
        if (isKeycloakEnabled()) {
            HawtioKeycloak.log.debug("Applying AuthInterceptor to $http");
            $httpProvider.interceptors.push(HawtioKeycloak.AuthInterceptor.Factory);
        }
    }
    function loginUserDetails(userDetails, postLogoutTasks) {
        'ngInject';
        if (!isKeycloakEnabled()) {
            return;
        }
        userDetails.login(HawtioKeycloak.userProfile.username, null, HawtioKeycloak.userProfile.token);
        HawtioKeycloak.log.debug("Register 'LogoutKeycloak' to postLogoutTasks");
        postLogoutTasks.addTask('LogoutKeycloak', function () {
            HawtioKeycloak.log.info("Log out Keycloak");
            HawtioKeycloak.keycloak.logout();
        });
    }
    function configureIdleTimeout(userDetails, Idle, $rootScope) {
        'ngInject';
        if (!isKeycloakEnabled()) {
            HawtioKeycloak.log.debug("Not enabling idle timeout");
            return;
        }
        HawtioKeycloak.log.debug("Enabling idle timeout");
        Idle.watch();
        $rootScope.$on('IdleTimeout', function () {
            HawtioKeycloak.log.debug("Idle timeout triggered");
            // let the end application handle this event
            // userDetails.logout();
        });
        $rootScope.$on('Keepalive', function () {
            if (HawtioKeycloak.keycloak) {
                HawtioKeycloak.keycloak.updateToken(5).success(function () {
                    userDetails.token = HawtioKeycloak.keycloak.token;
                });
            }
        });
    }
    hawtioPluginLoader
        .addModule(HawtioKeycloak.pluginName)
        .registerPreBootstrapTask({
        name: 'HawtioKeycloak',
        task: function (next) { return loadKeycloakJs(next); }
    });
    function loadKeycloakJs(callback) {
        if (!HawtioKeycloak.config) {
            HawtioKeycloak.log.debug("Keycloak disabled");
            callback();
            return;
        }
        var keycloakJsUri = new URI(HawtioKeycloak.config.url).segment('js/keycloak.js').toString();
        $.getScript(keycloakJsUri)
            .done(function (script, textStatus) { return initKeycloak(callback); })
            .fail(function (response) {
            HawtioKeycloak.log.warn("Error fetching keycloak adapter:", response);
            callback();
        });
    }
    function initKeycloak(callback) {
        HawtioKeycloak.keycloak = Keycloak(HawtioKeycloak.config);
        HawtioKeycloak.keycloak.init({ onLoad: 'login-required' })
            .success(function (authenticated) {
            HawtioKeycloak.log.debug("Authenticated:", authenticated);
            if (!authenticated) {
                HawtioKeycloak.keycloak.login({ redirectUri: window.location.href });
                return;
            }
            HawtioKeycloak.keycloak.loadUserProfile()
                .success(function (profile) {
                HawtioKeycloak.userProfile = profile;
                HawtioKeycloak.userProfile.token = HawtioKeycloak.keycloak.token;
                callback();
            })
                .error(function () {
                HawtioKeycloak.log.debug("Failed to load user profile");
                callback();
            });
        })
            .error(function (error) {
            HawtioKeycloak.log.warn("Failed to initialize Keycloak, token unavailable", error);
            callback();
        });
    }
})(HawtioKeycloak || (HawtioKeycloak = {}));
/// <reference path="oauth.helper.ts"/>
/// <reference path="github/ts/githubPlugin.ts"/>
/// <reference path="googleOAuth/ts/googleOAuthPlugin.ts"/>
/// <reference path="osOAuth/ts/osOAuthPlugin.ts"/>
/// <reference path="keycloak/keycloak.module.ts"/>
var HawtioOAuth;
(function (HawtioOAuth) {
    addLogoutToUserDropdown.$inject = ["HawtioExtension", "$compile", "userDetails"];
    var hawtioOAuthModule = angular
        .module(HawtioOAuth.pluginName, [
        'ngIdle',
        GithubOAuth.pluginName,
        GoogleOAuth.pluginName,
        HawtioKeycloak.pluginName,
        OSOAuth.pluginName
    ])
        .run(addLogoutToUserDropdown)
        .name;
    hawtioPluginLoader.addModule(HawtioOAuth.pluginName);
    function addLogoutToUserDropdown(HawtioExtension, $compile, userDetails) {
        'ngInject';
        HawtioExtension.add('hawtio-user', function ($scope) {
            $scope.userDetails = userDetails;
            var template = '<li ng-show="userDetails"><a href="" ng-click="userDetails.logout()">Logout</a></li>';
            return $compile(template)($scope);
        });
    }
    HawtioOAuth.addLogoutToUserDropdown = addLogoutToUserDropdown;
    /*
     * Fetch oauth config
     */
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'HawtioOAuthConfig',
        task: function (next) {
            $.getScript('oauth/config.js').always(next);
        }
    });
    /*
     * Global pre-bootstrap task that plugins can use to wait
     * until all oauth plugins have been processed
     *
     * OAuth plugins can add to this list via:
     *
     *   HawtioOAuth.oauthPlugins.push(<plugin name>);
     *
     * and then use a named task with the same name as <plugin name>
     */
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'HawtioOAuthBootstrap',
        depends: HawtioOAuth.oauthPlugins,
        task: function (next) {
            HawtioOAuth.getUserProfile();
            HawtioOAuth.log.info("All OAuth plugins have been executed:", HawtioOAuth.oauthPlugins);
            next();
        }
    });
})(HawtioOAuth || (HawtioOAuth = {}));
/// <reference path="../plugins/oauth.module.ts"/>
var Example;
(function (Example) {
    Example.pluginName = "hawtio-example-oauth";
    Example.log = Logger.get(Example.pluginName);
    Example.templatePath = "test-plugins/example";
})(Example || (Example = {}));
var Example;
(function (Example) {
    page1Controller.$inject = ["$scope", "userDetails"];
    function page1Controller($scope, userDetails) {
        'ngInject';
        Example.log.debug("userDetails:", userDetails);
        $scope.userDetails = angular.toJson({
            username: userDetails.username,
            password: '********',
            token: userDetails.token
        }, true);
    }
    Example.page1Controller = page1Controller;
})(Example || (Example = {}));
var Example;
(function (Example) {
    page2Controller.$inject = ["$scope", "GithubOAuth", "HawtioPreferences"];
    function page2Controller($scope, GithubOAuth, HawtioPreferences) {
        'ngInject';
        var oauth = $scope.oauth = GithubOAuth;
        $scope.prefs = HawtioPreferences;
        if (oauth.hasToken()) {
            $.ajax('https://api.github.com/user/orgs', {
                method: 'GET',
                headers: {
                    'Authorization': oauth.getHeader(),
                },
                success: function (data) {
                    $scope.data = data;
                },
                error: function (data) {
                    $scope.data = data;
                },
                complete: function () {
                    Core.$apply($scope);
                },
                beforeSend: GithubOAuth.emptyBeforeSend
            });
        }
    }
    Example.page2Controller = page2Controller;
})(Example || (Example = {}));
/// <reference path="../includes.ts"/>
/// <reference path="example.globals.ts"/>
/// <reference path="page1.controller.ts"/>
/// <reference path="github.controller.ts"/>
var Example;
(function (Example) {
    buildTabs.$inject = ["$locationProvider", "$routeProvider", "HawtioNavBuilderProvider", "tabs"];
    loadTabs.$inject = ["HawtioNav", "tabs"];
    Example.exampleModule = angular
        .module(Example.pluginName, [])
        .constant('tabs', [])
        .config(buildTabs)
        .run(loadTabs)
        .controller("Example.Page1Controller", Example.page1Controller)
        .controller("Example.Page2Controller", Example.page2Controller)
        .name;
    function buildTabs($locationProvider, $routeProvider, HawtioNavBuilderProvider, tabs) {
        'ngInject';
        var tab = HawtioNavBuilderProvider.create()
            .id(Example.pluginName)
            .title(function () { return "Examples"; })
            .href(function () { return "/example"; })
            .subPath("OpenShift OAuth", "page1", HawtioNavBuilderProvider.join(Example.templatePath, 'page1.html'))
            .subPath("GitHub", "page2", HawtioNavBuilderProvider.join(Example.templatePath, 'github.html'))
            .build();
        HawtioNavBuilderProvider.configureRouting($routeProvider, tab);
        $locationProvider.html5Mode(true);
        tabs.push(tab);
    }
    function loadTabs(HawtioNav, tabs) {
        'ngInject';
        _.forEach(tabs, function (tab) { return HawtioNav.add(tab); });
        Example.log.debug("loaded");
    }
    // Google
    /*
    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      GoogleOAuthConfig = {
        clientId: '520210845630-173pe9uuvejqvahls9td8b5n4nae0tvm.apps.googleusercontent.com',
        clientSecret: 'Uza-yS-E2Ph1eCcs6OZy-4ui',
        authenticationURI: 'https://accounts.google.com/o/oauth2/auth',
        scope: 'profile',
        redirectURI: 'http://localhost:9000'
      };
      next();
    }, true);
    */
    // Standard Keycloak server
    hawtioPluginLoader.registerPreBootstrapTask({
        name: 'ExampleKeycloakConfig',
        task: function (next) {
            HawtioKeycloak.config = {
                clientId: 'hawtio-client',
                url: 'http://localhost:8080/auth',
                realm: 'hawtio-demo'
            };
            next();
        }
    }, true);
    // openshift
    /*
    hawtioPluginLoader.registerPreBootstrapTask((next) => {
      OSOAuthConfig = {
        oauth_authorize_uri: "https://172.28.128.4:8443/oauth/authorize",
        oauth_client_id: "fabric8",
        logout_uri: ""
      };
      next();
    }, true);
  
    hawtioPluginLoader.registerPreBootstrapTask({
      name: 'test-init',
      depends: ['hawtio-oauth'],
      task: (next) => {
        let uri = new URI('https://172.28.128.4:8443/api/v1');
        uri.path('/api/v1/namespaces');
        let url = uri.toString();
        HawtioOAuth.authenticatedHttpRequest({
          url: uri.toString()
        }).done((data) => {
          log.debug("Got data: ", data);
          next();
        }).fail((xHr, textStatus, errorThrown) => {
          log.warn(textStatus, errorThrown);
          HawtioOAuth.doLogout();
        });
      }
    });
    */
    hawtioPluginLoader.addModule(Example.pluginName);
})(Example || (Example = {}));

angular.module('hawtio-oauth-test-templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('test-plugins/example/github.html','<div ng-controller="Example.Page2Controller">\n  <div class="row" ng-if="!oauth.hasToken() || data.status === 403">\n    <div class="col-md-12">\n      <div class="alert alert-warning">\n        No GitHub credentials available, <a href="" ng-click="prefs.goto(\'Github\')">configure your GitHub account</a>\n      </div>\n    </div>\n  </div>\n  <div class="row" ng-if="oauth.hasToken()">\n    <div class="col-md-12">\n      <pre>{{data | json}}</pre>\n    </div>\n  </div>\n</div>\n');
$templateCache.put('test-plugins/example/page1.html','<div ng-controller="Example.Page1Controller">\n  <h1>User Details</h1>\n  <pre>{{userDetails}}</pre>\n</div>\n');}]); hawtioPluginLoader.addModule("hawtio-oauth-test-templates");