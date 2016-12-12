# FioriBuildEnv
A gulp-based build environment for Fiori development, including deployment to an ERP/Gateway server

# Requirements

- NodeJS v6.5 or greater (https://nodejs.org/en/)
- (Recommended) VS Code (https://code.visualstudio.com/)

# Features

- Transpilation:
    - JavaScript files to ES5 using Babel.
    - SASS to CSS.
- Linting:
    - JavaScript using ESlint against (a slightly modified) airbnb ruleset.
    - SASS using sass-lint.
- Generates JavaScript and CSS source maps for easier browser debugging.
- Minifies XML and HTML.
- Builds a Component-preload.js containing all XML and JavaScript files.
- Incudes a local browsersync development server with:
    - Easy service authentication,
    - Proxy middleware to forward OData service calls to your gateway server,
    - Automatic reloads on source code changes.
- One click deployment to an ERP/Gateway server.

# Configuration

This gulp tasks will read config from the `/gulpTaskFiles/sap-config.json` file, which has the following options:

```JavaScript
{
    gateway: '<url>',            // url for the service endpoint and deployment server : '<scheme>://<host>:<port>'
    launchpadUrl: '<dir>',       // url for the launchpad (defaults to 'sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html')
    cookieName: '<name>',        // the name of the cookie that will be fetched during the auth process
    localDevPort: '<port>',      // the port that browsersync will run off (defaults to 3000)
    bspDeployTarget: '<name>',   // the name of the BSP application to which the auto deployment script will deploy to
    deploymentService: '<name>', // the name of the OData service which you setup (as per the deployment section below)
}
```

# File Structure

## Single App File Structure
This is the general use case; use this structure if you are building a single app to be served from a single BSP application.
```
|
├── /.vscode/                   # visual studio code config files
├── /gulpTaskFiles/             # files relating to the gulp tasks
│   ├── /tasks/                 # code for individual gulp tasks
│   └── /sap-config.json        # config file for the build processes
├── /node_modules/              # 3rd-party libraries and utilities
├── /src/                       # The source code of the application
│   ├── /index.html             # Base HTML page
│   ├── /js/                    # javascript/code related source files
│   │   ├── /controller/        # Controller JavaScript files
│   │   ├── /i18n/              # Internationalisation *.properties files
│   │   ├── /view/              # View XML files
│   │   ├── /fragment/          # Fragment XML files
│   │   ├── /Component.js       # Component definition file
│   │   └── /manifest.json      # Component manifest file
│   └── /css/                   # StyleSheet files (scss)
├── /build/                     # build directory
└── /zip/                       # deployment zips
```

## Multi-App Source File Structure
A slightly more advanced use case; use this structure you are building multiple apps to be served from a single BSP application.
This is useful if you've got a few closely related apps that you want logically separated, but don't want to manage separate BSP applications.
All apps will be built into separate Component-preload.js files.
```
├── /src/
│   ├── /app_ONE                    # app_ONE source code
│   │   ├── /index.html             # Base HTML page
│   │   ├── /js/                    # javascript/code related source files
│   │   │   ├── /controller/        # Controller JavaScript files
│   │   │   ├── /i18n/              # Internationalisation *.properties files
│   │   │   ├── /view/              # View XML files
│   │   │   ├── /fragment/          # Fragment XML files
│   │   │   ├── /Component.js       # Component definition file
│   │   │   └── /manifest.json      # Component manifest file
|   │   └── /css/                   # StyleSheet files (scss)
│   ├── /app_TWO                    # app_TWO source code
│   │   └── ...                     # repeat the structure...
│   ├── /library_ONE                # library_ONE source code
│   │   ├── /is.library             # Library indicator file
│   │   ├── /js/                    # javascript/code related source files
│   │   │   ├── /controller/        # Controller JavaScript files
│   │   │   ├── /i18n/              # Internationalisation *.properties files
│   │   │   ├── /view/              # View XML files
│   │   │   ├── /fragment/          # Fragment XML files
│   │   │   ├── /Component.js       # Component definition file
│   │   │   └── /manifest.json      # Component manifest file
|   │   └── /css/                   # StyleSheet files (scss)
│   └── ...                         # repeat...
```

Note that for the library above, an empty file is added to the tree name `is.library`.
This file tells the library that the package is intended to be built into a `library-preload.json` instead of a `Component-preload.js`.

# Gulp Tasks

### glup watch

- Fetches login cookies from the SAP server,
- Starts the local development server with proxies,
- Watches for changes to all buildable files, and
- Rebuilds files on change.

The development server will automatically proxy all OData service requests to your desired endpoint.

#### flags

- ```--no-server```
    - Watches for changes to all buildable files and rebuilds on change.
- ```--no-auth```
    - Skips fetching an auth token from the SAP.
- ```--no-proxy```
    - Disables the proxy to the SAP server, and the authentication


### gulp build

Builds the source code into the build folder.


### gulp deploy

Builds the source code, then opens a window to manage the deployment (see [Deployment](#deployment)).

#### flags

- ```--no-rebuild```
    - Don't rebuild before opening the confirmation page
- ```--no-auth```
    - Skips fetching an auth token from the SAP.


# Deployment

1. Obtain a lock on the BSP application.
1. Run ``gulp deploy``.
1. Follow the prompts.

Alternately if you already have a watch server running, you can just open ```http://localhost:3000/deploy``` in your browser (where 3000 is the dev port defined in your config).

# Deployment to SAP

To automate deployment to SAP we need to:
 - copy a standard function module and make some changes
 - create an OData Service

## Function Module

Make a copy of the SAP Function Module  ```/UI5/UI5_REPOSITORY_LOAD_HTTP```  and its includes, calling it ```ZUI5_REPOSITORY_LOAD_HTTP```, then make the following changes:

Add a new importing parameter:
```abap
VALUE(IV_ZIP_FILE) TYPE  XSTRING DEFAULT ''
```

Add this code to line 171 to use the zip file passed in:
```abap
GET REFERENCE OF ev_log_messages INTO log_messages_ref.
  CREATE OBJECT sapui5_archive
    EXPORTING
      iv_url          = iv_url
      iv_zip_file     = iv_zip_file
      ir_log_messages = log_messages_ref.
```

In the copy of the include ```/UI5/LUI5_REPOSITORY_LOADD01``` change the constructor on line 135:
```abap
methods: constructor importing iv_url type string
         iv_zip_file type xstring optional
         ir_log_messages type ref to string_table,
```

Change the copy of the include ```/UI5/LUI5_REPOSITORY_LOADP01``` to use the zip file passed in:
```abap
*   Access zip file via http
    IF iv_zip_file IS NOT SUPPLIED.
*     ... Confirm Url
      cl_http_client=>create_by_url( EXPORTING  url = me->url
                                     IMPORTING  client = me->http_client
                                     EXCEPTIONS argument_not_found = 1
                                        plugin_not_active  = 2
                                        internal_error     = 3
                                        OTHERS             = 4  ).
      IF sy-subrc <> 0.
        me->ok = abap_false. me->error_message = text-011.
        REPLACE '%' IN me->error_message WITH me->url.
        APPEND me->error_message TO log_messages_ref->*.
        EXIT.
      ELSE.
        DATA: message TYPE string.
        message = text-012. APPEND message TO me->log_messages_ref->*.
        CONCATENATE '. ' iv_url INTO message RESPECTING BLANKS.
        APPEND message TO log_messages_ref->*.
      ENDIF.

*    ... Grep binary content of archive
      DATA: return_code TYPE sysubrc.
      http_client->send( EXCEPTIONS OTHERS = 1 ).
      http_client->receive( EXCEPTIONS OTHERS = 1 ).

      http_client->get_last_error(
        IMPORTING
          code = return_code
          message = message
      ).
      IF return_code IS NOT INITIAL.
        me->ok = abap_false. me->error_message = text-011.
        REPLACE '%' IN me->error_message WITH me->url.
        APPEND me->error_message TO me->log_messages_ref->*.
        EXIT.
      ENDIF.


         xstring = http_client->response->get_data( ).
       ELSE.
         xstring = iv_zip_file.
    ENDIF.
```


## OData Service

Create a new OData project in SAP transaction SEGW. Add an entity called Project with the following properties:
 - appName (Edm.String / Key)
 - zipFile (Edm.Binary)

Implement the 'Create' operation and use the following code:
```abap
method projects_create_entity.

    data:
      lt_log_messages      type string_table,
      ls_error_message     type string,
      lt_object_locks      type  cts_object_locks,
      lt_recording_entries type cts_recording_entries,
      ls_recording_entries type cts_recording_entry,
      lt_requests          type cts_requests,
      lv_success           type char1.

    field-symbols:
           <ls_log_messages> like line of lt_log_messages .

    io_data_provider->read_entry_data(
      importing
        es_data = er_entity ).

    " lets get the transport
    data(lv_transport) = er_entity-app_name.
    translate lv_transport to upper case.

    ls_recording_entries-object_entry-object_key-pgmid = 'R3TR'.
    ls_recording_entries-object_entry-object_key-object = 'WAPA'.
    ls_recording_entries-object_entry-object_key-obj_name = lv_transport.
    append ls_recording_entries to lt_recording_entries.

    " make sure we have an object lock
    call function 'CTS_WBO_API_CHECK_OBJECTS'
      exporting
        recording_entries = lt_recording_entries
        as4user           = sy-uname
      importing
        requests          = lt_requests
        object_locks      = lt_object_locks.

    if lt_object_locks is initial.
      raise exception type /iwbep/cx_mgw_busi_exception
        exporting
          textid            = /iwbep/cx_mgw_busi_exception=>business_error_unlimited
          message_unlimited = 'No open transports found. Create a transport and then give it another crack.'.
    endif.

    " upload the files to the bsp app
    call function 'ZUI5_REPOSITORY_LOAD_HTTP'
      exporting
        iv_zip_file                = er_entity-zip_file
        iv_url                     = 'NA'
        iv_sapui5_application_name = er_entity-app_name
        iv_workbench_request       = lt_object_locks[ 1 ]-lock_holder-req_header-trkorr
        iv_external_code_page      = 'Cp1252'
      importing
        ev_success                 = lv_success
        ev_log_messages            = lt_log_messages.
    loop at lt_log_messages assigning <ls_log_messages>.
      ls_error_message  = ls_error_message && ' ' && <ls_log_messages>.
    endloop.

    " didn't work?
    if lv_success <> 'S'.
      raise exception type /iwbep/cx_mgw_busi_exception
        exporting
          textid            = /iwbep/cx_mgw_busi_exception=>business_error_unlimited
          message_unlimited = ls_error_message.
    endif.

  endmethod.
  ```
