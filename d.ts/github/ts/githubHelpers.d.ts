declare module GithubOAuth {
    var pluginName: string;
    var log: Logging.Logger;
    var templatePath: string;
    function getTokenCheckAuthURL(oauthSettings: any): string;
    function getTokenCheckAuthHeader(oauthSettings: any): string;
    function getAuthHeader(oauthSettings: any): string;
    function loadSettings(): {};
    function storeSettings(settings: any, oauthSettings?: any): void;
}
