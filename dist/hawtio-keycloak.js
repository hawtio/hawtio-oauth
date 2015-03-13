/// <reference path="../libs/hawtio-utilities/defs.d.ts"/>

/// <reference path="../../includes.ts"/>
var HawtioKeycloak;
(function (HawtioKeycloak) {
    HawtioKeycloak.pluginName = 'hawtio-keycloak';
    HawtioKeycloak.log = Logger.get(HawtioKeycloak.pluginName);
    HawtioKeycloak.keycloak = undefined;
    HawtioKeycloak.userProfile = undefined;
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
            return _.merge($delegate, userProfile);
        }]);
    }]);
    HawtioKeycloak._module.run(['userDetails', function (userDetails) {
        HawtioKeycloak.log.debug("loaded, userDetails: ", userDetails);
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
