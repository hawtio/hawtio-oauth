const
  gulp = require('gulp'),
  eventStream = require('event-stream'),
  gulpLoadPlugins = require('gulp-load-plugins'),
  del = require('del'),
  path = require('path'),
  s = require('underscore.string'),
  argv = require('yargs').argv,
  stringifyObject = require('stringify-object'),
  logger = require('js-logger'),
  hawtio = require('@hawtio/node-backend');

const package = require('./package.json');
const plugins = gulpLoadPlugins({});

const config = {
  proxyPort: argv.port || 9000,
  targetPath: argv.path || '/jolokia',
  logLevel: argv.debug ? logger.DEBUG : logger.INFO,
  ts: ['plugins/**/*.ts', 'vendor/**/*.ts'],
  testTs: ['test-plugins/**/*.ts'],
  templates: ['plugins/**/*.html', 'plugins/**/*.md'],
  testTemplates: ['test-plugins/**/*.html'],
  templateModule: 'hawtio-oauth-templates',
  testTemplateModule: 'hawtio-oauth-test-templates',
  dist: argv.out || './dist/',
  js: 'hawtio-oauth.js',
  dts: 'hawtio-oauth.d.ts',
  testJs: 'hawtio-oauth-test.js',
  tsProject: plugins.typescript.createProject('tsconfig.json'),
  testTsProject: plugins.typescript.createProject('tsconfig.json'),
  sourceMap: argv.sourcemap
};

gulp.task('clean-defs', function () {
  return del(config.dist + '*.d.ts');
});

gulp.task('example-tsc', ['tsc'], function () {
  const tsResult = gulp.src(config.testTs)
    .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.init()))
    .pipe(config.testTsProject());

  return tsResult.js
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.write()))
    .pipe(plugins.concat('test-compiled.js'))
    .pipe(gulp.dest('.'));
});

gulp.task('example-template', ['example-tsc'], function () {
  return gulp.src(config.testTemplates)
    .pipe(plugins.angularTemplatecache({
      filename: 'test-templates.js',
      root: 'test-plugins/',
      standalone: true,
      module: config.testTemplateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.testTemplateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('example-concat', ['example-template'], function () {
  return gulp.src(['test-compiled.js', 'test-templates.js'])
    .pipe(plugins.concat(config.testJs))
    .pipe(gulp.dest(config.dist));
});

gulp.task('example-clean', ['example-concat', 'clean'], function () {
  return del(['test-templates.js', 'test-compiled.js']);
});

gulp.task('tsc', ['clean-defs'], function () {
  const tsResult = gulp.src(config.ts)
    .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.init()))
    .pipe(config.tsProject());

  return eventStream.merge(
    tsResult.js
      .pipe(plugins.ngAnnotate())
      .pipe(plugins.if(config.sourceMap, plugins.sourcemaps.write()))
      .pipe(gulp.dest('.')),
    tsResult.dts
      .pipe(plugins.rename(config.dts))
      .pipe(gulp.dest(config.dist)));
});

gulp.task('template', ['tsc'], function () {
  return gulp.src(config.templates)
    .pipe(plugins.angularTemplatecache({
      filename: 'templates.js',
      root: 'plugins/',
      standalone: true,
      module: config.templateModule,
      templateFooter: '}]); hawtioPluginLoader.addModule("' + config.templateModule + '");'
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('vendor-defs', ['clean-defs'], function () {
  return gulp.src('vendor/**/*.d.ts')
    .pipe(gulp.dest(config.dist));
});

gulp.task('concat', ['template'], function () {
  return gulp.src(['compiled.js', 'templates.js'])
    .pipe(plugins.concat(config.js))
    .pipe(gulp.dest(config.dist));
});

gulp.task('clean', ['concat'], function () {
  return del(['templates.js', 'compiled.js']);
});

gulp.task('watch', ['build', 'build-example'], function () {
  gulp.watch(['index.html', config.dist + '/*'], ['reload']);
  gulp.watch([config.ts, config.templates], ['tsc', 'template', 'concat', 'clean']);
  gulp.watch([config.testTs, config.testTemplates], ['example-tsc', 'example-template', 'example-concat', 'example-clean']);
});


gulp.task('connect', ['watch'], function () {
  /*
   * Example of fetching a URL from the environment, in this case for kubernetes
  const kube = uri(process.env.KUBERNETES_MASTER || 'http://localhost:8080');
  console.log("Connecting to Kubernetes on: " + kube);
  */

  hawtio.setConfig({
    logLevel: config.logLevel,
    port: config.proxyPort,
    proxy: '/hawtio/proxy',
    staticProxies: [
      /*
      // proxy to a service, in this case kubernetes
      {
        proto: kube.protocol(),
        port: kube.port(),
        hostname: kube.hostname(),
        path: '/services/kubernetes',
        targetPath: kube.path()
      },
      // proxy to a jolokia instance
      {
        proto: kube.protocol(),
        hostname: kube.hostname(),
        port: kube.port(),
        path: '/jolokia',
        targetPath: '/hawtio/jolokia'
      }
      */
    ],
    staticAssets: [{
      path: '/hawtio/',
      dir: '.'

    }],
    fallback: 'index.html',
    liveReload: {
      enabled: true
    }
  });

  hawtio.use('/', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    const path = req.originalUrl;
    if (path === '/') {
      res.redirect('/hawtio');
    } else if (s.startsWith(path, '/plugins/') && s.endsWith(path, 'html')) {
      // avoid returning these files, they should get pulled from js
      console.log("returning 404 for: ", path);
      res.statusCode = 404;
      res.end();
    } else {
      // console.log("allowing: ", path);
      next();
    }
  });

  hawtio.use('/hawtio/oauth/config.js', function (req, res, next) {
    const kubeBase = process.env.KUBERNETES_MASTER || 'http://localhost:9000';
    const useAuthentication = process.env.DISABLE_OAUTH !== "true";
    const formUri = process.env.FORM_URI;
    const config = {
      master_uri: kubeBase,
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
      },
      github: {
        clientId: process.env.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
        accessToken: process.env.GITHUB_ACCESS_TOKEN
      }
    };
    // TODO for now 'disable oauth' means turn off the openshift oauth flow
    if (useAuthentication) {
      config.openshift = {
        oauth_authorize_uri: kubeBase + '/oauth/authorize',
        oauth_client_id: 'fabric8'
      };
    }
    if (formUri) {
      config.form = {
        uri: formUri,
      };
    }
    const answer = "window.OPENSHIFT_CONFIG = window.HAWTIO_OAUTH_CONFIG = " + stringifyObject(config);
    res.set('Content-Type', 'application/javascript');
    res.send(answer);

  });

  hawtio.listen(function (server) {
    const host = server.address().address;
    const port = server.address().port;
    console.log("started from gulp file at ", host, ":", port);
  });
});

gulp.task('reload', function () {
  gulp.src('.')
    .pipe(hawtio.reload());
});

gulp.task('version', function () {
  return gulp.src(path.join(config.dist, config.js))
    .pipe(plugins.replace('PACKAGE_VERSION_PLACEHOLDER', package.version))
    .pipe(gulp.dest(config.dist));
});

gulp.task('build', ['tsc', 'template', 'concat', 'vendor-defs', 'clean']);

gulp.task('build-example', ['example-tsc', 'example-template', 'example-concat', 'example-clean']);

gulp.task('default', ['connect']);
