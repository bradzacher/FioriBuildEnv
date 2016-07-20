# FioriBuildEnv
A gulp-based build environment for Fiori, including deployment to a ERP/Gateway server

# File Structure

```
|
├── /.vscode/                   # visual studio code config files
├── /gulpTaskFiles/             # files relating to the gulp tasks
├── /node_modules/              # 3rd-party libraries and utilities
├── /src/                       # The source code of the application
│   ├── /index.html             # Base HTML page
│   ├── /js/                    # javascript/code related source files
│   │   ├── /controller/        # Controller JavaScript files
│   │   ├── /i18n/              # Internationalisation *.properties files
│   │   ├── /view/              # View XML files
│   │   ├── /Component.js       # Component definition file
│   │   └── /manifest.json      # Component manifest file
|   └── /css/                   # StyleSheet files (scss)
├── /build/                     # development build files
├── /release/                   # production build files
└── /zip/                       # deployment zips
```

# Gulp Tasks

### glup watch

- Launches an electron window to fetch login cookies (note that ADFS federated logins will require you to enter user/password, as EPM is not yet supported by Chrome),
- Starts the browsersync web server,
- Watches for changes to all buildable files, and
- Rebuilds files on change.

The browsersync server contains middleware to auto-proxy all requests to your desired endpoint.
This task will read config from the `/gulpTaskFiles/sap-config.json` file, which has the following options:

```JavaScript
{
    gateway: '<url>', // url for the service endpoint and deployment server : '<scheme>://<host>:<port>'
    localDevPort: '<port>', // the port that browsersync will run off (defaults to 3000)
    bspApplication: '<name>', // the name of the BSP application to which the auto deployment script will deploy to
    jsNamespace: '<ns>', // the namespace for your UI5 code 
}
```

### gulp watch-no-server

Watches for changes to all buildable files and rebuilds on change.

### gulp build-dev, gulp build-prd

Builds the development/production version of the code

# Deployment

1. Obtain a lock on the BSP application.
2. Run the gulp watch task.
3. Head to http://localhost:<localDevPort>/deploy (<localDevPort> defaults to 3000)
4. Follow the prompts.


### TODO - add information about OData service setup
