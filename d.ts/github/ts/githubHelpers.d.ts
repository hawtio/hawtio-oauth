declare module GithubOAuth {
    var pluginName: string;
    var log: Logging.Logger;
    var templatePath: string;
    function loadSettings(): {};
    function storeSettings(settings: any): void;
}
